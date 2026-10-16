import { devices, expect, test, type Browser, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { loggedIn } from "./api";
import { admin, nanny } from "./logins";

const today = "2026-10-16";

async function logInOn(page: Page, login: { username: string; password: string }) {
  await page.clock.setFixedTime(new Date(`${today}T10:00:00+07:00`));
  await page.goto("./");
  await page.getByLabel("Username").fill(login.username);
  await page.getByLabel("Password").fill(login.password);
  await page.getByRole("button", { name: "Log in" }).click();
}

/** A second phone, logged in as the nanny. */
async function nannyPhone(browser: Browser, baseURL: string | undefined): Promise<Page> {
  const context = await browser.newContext({ ...devices["Pixel 7"], baseURL: baseURL ?? "" });
  const page = await context.newPage();
  await logInOn(page, nanny);
  return page;
}

// A 1×1 PNG and a tiny PDF, as a bank app would hand them over.
const slipPng = {
  name: "slip.png",
  mimeType: "image/png",
  buffer: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64",
  ),
};
const kbankPdf = {
  name: "kbank.pdf",
  mimeType: "application/pdf",
  buffer: Buffer.from("%PDF-1.4\n1 0 obj << >> endobj\ntrailer << >>\n%%EOF\n"),
};

type Upload = typeof kbankPdf;

/** Adds a payment paid today, with the given receipt files attached. */
async function addPaymentWith(page: Page, amount: string, note: string, files: Upload[]) {
  await page.getByRole("button", { name: "Add payment" }).click();
  const sheet = page.getByRole("dialog", { name: "Add payment" });
  await sheet.getByLabel("Amount").fill(amount);
  await sheet.getByLabel("Note").fill(note);
  await sheet.getByLabel("Add receipts").setInputFiles(files);
  await sheet.getByRole("button", { name: "Save payment" }).click();
  await expect(sheet).toBeHidden(); // closes once the payment and its receipts are saved
}

/** Deletes the payment its edit pen names, e.g. "Edit payment 300 paid 16 Oct". */
async function deletePayment(page: Page, pen: string) {
  await page.getByRole("button", { name: pen }).click();
  page.once("dialog", (dialog) => void dialog.accept());
  await page
    .getByRole("dialog", { name: "Edit payment" })
    .getByRole("button", { name: "Delete payment" })
    .click();
  await expect(page.getByRole("dialog")).toBeHidden();
}

test("admin adds a payment with 2 receipts; the nanny downloads one", async ({
  page,
  browser,
  baseURL,
}) => {
  await logInOn(page, admin);
  await addPaymentWith(page, "1,000", "Bank transfer", [slipPng, kbankPdf]);

  const lola = await nannyPhone(browser, baseURL);
  const payment = lola.getByRole("listitem").filter({ hasText: "Paid 16 Oct" });
  const download = lola.waitForEvent("download");
  await payment.getByRole("button", { name: "Download kbank.pdf" }).click();
  expect((await download).suggestedFilename()).toBe("kbank.pdf");

  await deletePayment(page, "Edit payment 1,000 paid 16 Oct");
});

test("admin removes a receipt from a payment: it leaves the Payments row", async ({ page }) => {
  await logInOn(page, admin);
  await addPaymentWith(page, "1,200", "Two slips", [slipPng, kbankPdf]);
  await page.getByRole("button", { name: "Edit payment 1,200 paid 16 Oct" }).click();
  const sheet = page.getByRole("dialog", { name: "Edit payment" });
  await sheet.getByRole("button", { name: "Remove kbank.pdf" }).click();
  await sheet.getByRole("button", { name: "Save payment" }).click();
  const payment = page.getByRole("listitem").filter({ hasText: "Two slips" });
  await expect(payment).toContainText("Paid 16 Oct · 1 receipt");
  await deletePayment(page, "Edit payment 1,200 paid 16 Oct");
});

/** A PNG of the given size, drawn in the browser. */
async function pngOf(page: Page, name: string, width: number, height: number): Promise<Upload> {
  const base64 = await page.evaluate(
    ({ w, h }) => {
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const context = canvas.getContext("2d");
      if (context === null) throw new Error("no canvas");
      context.fillStyle = "#4e9bd1";
      context.fillRect(0, 0, w, h);
      return canvas.toDataURL("image/png").split(",")[1] ?? "";
    },
    { w: width, h: height },
  );
  return { name, mimeType: "image/png", buffer: Buffer.from(base64, "base64") };
}

/** The type and size of an image file, as the browser decodes it. */
async function imageOf(page: Page, file: Buffer) {
  return page.evaluate(async (base64) => {
    const blob = await (await fetch(`data:application/octet-stream;base64,${base64}`)).blob();
    const bitmap = await createImageBitmap(blob);
    const bytes = new Uint8Array(await blob.slice(0, 3).arrayBuffer());
    const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    return { jpeg, width: bitmap.width, height: bitmap.height };
  }, file.toString("base64"));
}

test("a receipt image is shrunk in the browser to a JPEG at most 1600 px wide", async ({
  page,
  browser,
  baseURL,
}) => {
  await logInOn(page, admin);
  await addPaymentWith(page, "1,300", "Big screenshot", [await pngOf(page, "big.png", 3200, 2000)]);

  const lola = await nannyPhone(browser, baseURL);
  const download = lola.waitForEvent("download");
  await lola
    .getByRole("listitem")
    .filter({ hasText: "Big screenshot" })
    .getByRole("button", { name: "Download big.jpg" })
    .click();
  const file = await readFile(await (await download).path());
  expect(await imageOf(lola, file)).toEqual({ jpeg: true, width: 1600, height: 1000 });

  await deletePayment(page, "Edit payment 1,300 paid 16 Oct");
});

test("a HEIC receipt the browser can't decode is uploaded as it is", async ({
  page,
  browser,
  baseURL,
}) => {
  const heic = { name: "IMG_0042.HEIC", mimeType: "image/heic", buffer: Buffer.from("ftypheic…") };
  await logInOn(page, admin);
  await addPaymentWith(page, "1,400", "From the iPhone", [heic]);

  const lola = await nannyPhone(browser, baseURL);
  const download = lola.waitForEvent("download");
  await lola
    .getByRole("listitem")
    .filter({ hasText: "From the iPhone" })
    .getByRole("button", { name: "Download IMG_0042.HEIC" })
    .click();
  expect((await readFile(await (await download).path())).toString()).toBe("ftypheic…");

  await deletePayment(page, "Edit payment 1,400 paid 16 Oct");
});

test("deleting a payment deletes its receipt files", async ({ page }) => {
  await logInOn(page, admin);
  await addPaymentWith(page, "1,500", "Sent twice by mistake", [kbankPdf]);
  const asNanny = await loggedIn(nanny.username, nanny.password);
  const { data: row } = await asNanny
    .from("payments")
    .select("receipts")
    .eq("note", "Sent twice by mistake")
    .single<{ receipts: string[] }>();
  const path = row?.receipts[0] ?? "";

  await deletePayment(page, "Edit payment 1,500 paid 16 Oct");
  const { error } = await asNanny.storage.from("receipts").createSignedUrl(path, 60);
  expect(error?.message).toBe("Object not found");
});
