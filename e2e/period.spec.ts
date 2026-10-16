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
    "Salary (first part-month, agreed)11,000",
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

test("seeded Oct pay adds 15 h OT = 2,250 to the salary: total 22,250", async ({ page }) => {
  await logInOn(page, "2026-10-16");
  await expect(page.getByRole("region", { name: "Oct pay · 28 Sep – 27 Oct" })).toContainText(
    /Overtime 15 h\s*2,250\s*Total\s*22,250/,
  );
});

test("the calendar marks OT and leave days", async ({ page }) => {
  await logInOn(page, "2026-10-16");
  const days = page.getByRole("list", { name: "Days" });
  await expect(days.getByRole("listitem", { name: "Sat 10 Oct, overtime" })).toBeVisible();
  await expect(days.getByRole("listitem", { name: "Mon 19 Oct, leave" })).toBeVisible();
});

test("the Overtime & leave list shows each OT day's hours and pay, and leave with no deduction", async ({
  page,
}) => {
  await logInOn(page, "2026-10-16");
  const list = page.getByRole("list", { name: "Overtime & leave" });
  await expect(list.getByRole("listitem")).toHaveText([
    /^Wed30.*18:00–20:15.*375.*2\.5 h/,
    /^Mon5.*18:00–20:30.*375.*2\.5 h/,
    /^Wed7.*18:00–19:10.*225.*1\.5 h/,
    /^Sat10.*10:00–14:00.*600.*4 h/,
    /^Thu15.*07:30–09:00.*225.*1\.5 h/,
    /^Mon19.*Leave.*no deduction/,
    /^Tue20.*07:00–08:00 · 18:00–20:00.*450.*3 h/,
  ]);
});
