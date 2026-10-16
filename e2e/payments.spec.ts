import { expect, test, type Page } from "@playwright/test";
import { admin, nanny } from "./logins";

async function logInOn(page: Page, today: string, login: { username: string; password: string }) {
  await page.clock.setFixedTime(new Date(`${today}T10:00:00+07:00`));
  await page.goto("./");
  await page.getByLabel("Username").fill(login.username);
  await page.getByLabel("Password").fill(login.password);
  await page.getByRole("button", { name: "Log in" }).click();
}

const sepPay = "Sep pay · 14 Sep – 27 Sep";
const octPay = "Oct pay · 28 Sep – 27 Oct";

/** Adds a payment paid today to the pay period the sheet defaults to. */
async function addPayment(page: Page, amount: string, note: string) {
  await page.getByRole("button", { name: "Add payment" }).click();
  const sheet = page.getByRole("dialog", { name: "Add payment" });
  await sheet.getByLabel("Amount").fill(amount);
  await sheet.getByLabel("Note").fill(note);
  await sheet.getByRole("button", { name: "Save payment" }).click();
}

test("the first pay period shows paid 11,000 and balance 0", async ({ page }) => {
  await logInOn(page, "2026-10-16", nanny);
  await page.getByRole("button", { name: "Previous pay period" }).click();
  await expect(page.getByRole("region", { name: sepPay })).toContainText(
    "Paid11,000Fully paid0 THB",
  );
});

test("the nanny sees the first pay period's payment in its Payments list", async ({ page }) => {
  await logInOn(page, "2026-10-16", nanny);
  await page.getByRole("button", { name: "Previous pay period" }).click();
  await expect(page.getByRole("list", { name: "Payments" })).toHaveText(
    "Mon28Bank transferPaid 28 Sep11,000THB",
  );
});

test("admin adds a payment to Oct pay: paid and balance update", async ({ page }) => {
  await logInOn(page, "2026-10-16", admin);
  await addPayment(page, "12,000", "Bank transfer");
  await expect(page.getByRole("region", { name: octPay })).toContainText(
    "Paid12,000Balance to pay8,000 THB",
  );
});

test("a payment the admin adds appears in the pay period's Payments list", async ({ page }) => {
  await logInOn(page, "2026-10-16", admin);
  await addPayment(page, "500", "Taxi money");
  await expect(page.getByRole("list", { name: "Payments" })).toContainText(
    "Fri16Taxi moneyPaid 16 Oct500THB",
  );
});

test("the nanny has no Add payment button", async ({ page }) => {
  await logInOn(page, "2026-10-16", nanny);
  await expect(page.getByRole("region", { name: octPay })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add payment" })).toHaveCount(0);
});
