import { devices, expect, test, type Browser, type Page } from "@playwright/test";
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
