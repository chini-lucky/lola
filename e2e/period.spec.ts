import { expect, test, type Page } from "@playwright/test";
import { nanny } from "./logins";

async function logInOn(page: Page, today: string) {
  await page.clock.setFixedTime(new Date(`${today}T10:00:00+07:00`));
  await page.goto("./");
  await page.getByLabel("Username").fill(nanny.username);
  await page.getByLabel("Password").fill(nanny.password);
  await page.getByRole("button", { name: "Log in" }).click();
}

test("on 16 Oct the period view shows Oct pay, 28 Sep – 27 Oct, salary 20,000", async ({
  page,
}) => {
  await logInOn(page, "2026-10-16");
  await expect(page.getByRole("region", { name: "Oct pay · 28 Sep – 27 Oct" })).toContainText(
    "Salary20,000",
  );
});

test("‹ from Oct pay goes to the first pay period, 14 Sep – 27 Sep, salary 11,000", async ({
  page,
}) => {
  await logInOn(page, "2026-10-16");
  await page.getByRole("button", { name: "Previous pay period" }).click();
  await expect(page.getByRole("region", { name: "Sep pay · 14 Sep – 27 Sep" })).toContainText(
    "11,000",
  );
});

test("nothing comes before the first pay period", async ({ page }) => {
  await logInOn(page, "2026-09-20");
  await expect(page.getByRole("button", { name: "Previous pay period" })).toBeDisabled();
});

test("› from Dec pay goes to Jan pay 2027", async ({ page }) => {
  await logInOn(page, "2026-12-01");
  await page.getByRole("button", { name: "Next pay period" }).click();
  await expect(page.getByRole("region", { name: "Jan pay · 28 Dec – 27 Jan" })).toBeVisible();
});

test("the calendar marks a Thai public holiday", async ({ page }) => {
  await logInOn(page, "2026-10-16");
  await expect(page.getByRole("listitem", { name: "Tue 13 Oct, holiday" })).toBeVisible();
});

test("the calendar marks weekends", async ({ page }) => {
  await logInOn(page, "2026-10-16");
  await expect(page.getByRole("listitem", { name: "Sat 17 Oct, weekend" })).toBeVisible();
});
