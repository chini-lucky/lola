import { expect, test, type Page } from "@playwright/test";
import { addDay, clearDays } from "./api";
import { logIn } from "./login";
import { admin } from "./logins";

// Nov pay (28 Oct – 27 Nov 2026) has no seeded days; each test starts it empty.
test.beforeEach(async () => {
  await clearDays("2026-10-28", "2026-11-27");
});

async function adminOn16Nov(page: Page) {
  await page.clock.setFixedTime(new Date("2026-11-16T10:00:00+07:00"));
  await logIn(page, admin);
}

const novPay = (page: Page) => page.getByRole("region", { name: "Nov pay · 28 Oct – 27 Nov" });

test("an admin adds weekday OT 18:00–20:30 and the total goes up by 2.5 h = 375", async ({
  page,
}) => {
  await adminOn16Nov(page);
  await page.getByRole("button", { name: "Edit Tue 17 Nov" }).click();
  const sheet = page.getByRole("dialog", { name: "Tue 17 Nov" });
  await sheet.getByRole("button", { name: "Add a time" }).click();
  await sheet.getByLabel("Range 1 from").fill("18:00");
  await sheet.getByLabel("Range 1 to").fill("20:30");
  await sheet.getByRole("button", { name: "Save day" }).click();
  await expect(novPay(page)).toContainText(/Overtime 2\.5 h\s*375\s*Total\s*20,375/);
});

test("an OT range that ends before it starts is refused", async ({ page }) => {
  await adminOn16Nov(page);
  await page.getByRole("button", { name: "Edit Tue 17 Nov" }).click();
  const sheet = page.getByRole("dialog", { name: "Tue 17 Nov" });
  await sheet.getByRole("button", { name: "Add a time" }).click();
  await sheet.getByLabel("Range 1 from").fill("20:30");
  await sheet.getByLabel("Range 1 to").fill("18:00");
  await sheet.getByRole("button", { name: "Save day" }).click();
  await expect(sheet.getByRole("alert")).toHaveText(
    "Range 1 must start before it ends (a range can’t cross midnight).",
  );
});

test("an admin removes one of a day's OT ranges and edits the other: 3 h becomes 1 h", async ({
  page,
}) => {
  await addDay({ date: "2026-11-17", ot: ["07:00-08:00", "18:00-20:00"] });
  await adminOn16Nov(page);
  await page.getByRole("button", { name: "Edit Tue 17 Nov" }).click();
  const sheet = page.getByRole("dialog", { name: "Tue 17 Nov" });
  await sheet.getByRole("button", { name: "Remove range 1" }).click();
  await sheet.getByLabel("Range 1 to").fill("19:00");
  await sheet.getByRole("button", { name: "Save day" }).click();
  await expect(novPay(page)).toContainText(/Overtime 1 h\s*150\s*Total\s*20,150/);
});

test("an admin marks a day as leave with a note; the list shows it with no deduction", async ({
  page,
}) => {
  await adminOn16Nov(page);
  await page.getByRole("button", { name: "Edit Tue 17 Nov" }).click();
  const sheet = page.getByRole("dialog", { name: "Tue 17 Nov" });
  await sheet.getByRole("switch", { name: /Leave/ }).check();
  await sheet.getByLabel("Note").fill("Sick day");
  await sheet.getByRole("button", { name: "Save day" }).click();
  await expect(
    page.getByRole("list", { name: "Overtime & leave" }).getByRole("listitem"),
  ).toHaveText([/^Tue17.*Leave.*Sick day · no deduction/]);
});
