import { expect, test, type Page } from "@playwright/test";
import { nanny } from "./logins";

async function logInOn(page: Page, today: string, login: { username: string; password: string }) {
  await page.clock.setFixedTime(new Date(`${today}T10:00:00+07:00`));
  await page.goto("./");
  await page.getByLabel("Username").fill(login.username);
  await page.getByLabel("Password").fill(login.password);
  await page.getByRole("button", { name: "Log in" }).click();
}

const sepPay = "Sep pay · 14 Sep – 27 Sep";

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
