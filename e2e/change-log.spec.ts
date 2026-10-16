import { expect, test, type Page } from "@playwright/test";
import { asAdmin, newUsername, signUpNanny, signUpWaiting } from "./api";
import { logIn } from "./login";
import { admin, nanny } from "./logins";

// Nov pay (28 Oct – 27 Nov 2026) has no seeded days; each test starts it empty.
test.beforeEach(async () => {
  await asAdmin((db) =>
    db.from("days").delete().gte("date", "2026-10-28").lte("date", "2026-11-27"),
  );
});

async function openChangeLog(page: Page) {
  await page.getByRole("link", { name: "Settings" }).click();
  await page.getByRole("link", { name: "Change log" }).click();
}

/** The change log's newest entry. */
const newest = (page: Page) =>
  page
    .getByRole("list", { name: /^Changes / })
    .first()
    .getByRole("listitem")
    .first();

test("an admin's day edit shows first in the change log with its before and after", async ({
  page,
}) => {
  await asAdmin((db) => db.from("days").insert({ date: "2026-11-17", ot: ["18:00-19:00"] }));
  await page.clock.setFixedTime(new Date("2026-11-16T10:00:00+07:00"));
  await logIn(page, admin);
  await page
    .getByRole("list", { name: "Days" })
    .getByRole("button", { name: "Edit Tue 17 Nov" })
    .click();
  const sheet = page.getByRole("dialog", { name: "Tue 17 Nov" });
  await sheet.getByLabel("Range 1 to").fill("19:10");
  await sheet.getByRole("button", { name: "Save day" }).click();
  await expect(sheet).toBeHidden();

  await openChangeLog(page);
  await expect(newest(page)).toHaveAccessibleName(
    /^\d\d:\d\d, Changed Day Tue 17 Nov: OT 18:00–19:00 → 18:00–19:10, by chini-lucky$/,
  );
});

test.describe("payments, rates, holidays and role changes", () => {
  test.afterEach(async () => {
    await asAdmin((db) => db.from("payments").delete().eq("note", "change log test"));
    await asAdmin((db) => db.from("rates").delete().eq("effective_from", "2027-03-28"));
  });

  test("an added payment shows its amount, date paid and pay period", async ({ page }) => {
    await asAdmin((db) =>
      db.from("payments").insert({
        period_end: "2026-11-27",
        paid_on: "2026-11-28",
        amount: 20375,
        note: "change log test",
      }),
    );
    await logIn(page, admin);
    await openChangeLog(page);
    await expect(newest(page)).toHaveAccessibleName(
      /^\d\d:\d\d, Added Payment: Amount 20,375 · Paid on 28 Nov 2026 · For Nov pay · Note change log test, by chini-lucky$/,
    );
  });

  test("a new pay rate shows its salary and OT rate", async ({ page }) => {
    await asAdmin((db) =>
      db.from("rates").insert({ effective_from: "2027-03-28", salary: 25000, ot_rate: 150 }),
    );
    await logIn(page, admin);
    await openChangeLog(page);
    await expect(newest(page)).toHaveAccessibleName(
      /^\d\d:\d\d, Added Pay rate from 28 Mar 2027: Salary 25,000 · OT \/ hour 150, by chini-lucky$/,
    );
  });

  test("a removed holiday shows what was removed", async ({ page }) => {
    await asAdmin((db) => db.from("holidays").insert({ date: "2027-03-17", name: "Pooh day" }));
    await asAdmin((db) => db.from("holidays").delete().eq("date", "2027-03-17"));
    await logIn(page, admin);
    await openChangeLog(page);
    await expect(newest(page)).toHaveAccessibleName(
      /^\d\d:\d\d, Removed Holiday 17 Mar 2027: Name Pooh day, by chini-lucky$/,
    );
  });

  test("approving a sign-up shows as a role change by the admin", async ({ page }) => {
    const username = newUsername("logged");
    await signUpNanny(username, "a-good-password");
    await logIn(page, admin);
    await openChangeLog(page);
    await expect(newest(page)).toHaveAccessibleName(
      new RegExp(
        `^\\d\\d:\\d\\d, Changed Person ${username}: Role Waiting → Nanny, by chini-lucky$`,
      ),
    );
  });
});

test("the change log is for admins only: a nanny opening its link sees the pay period", async ({
  page,
}) => {
  await logIn(page, nanny);
  await page.goto("./#/changes");
  await expect(page.getByRole("list", { name: "Days" })).toBeVisible();
  await expect(page.getByText("Change log")).toBeHidden();
});

test("a sign-up shows as added by the person who signed up", async ({ page }) => {
  const username = newUsername("joined");
  await signUpWaiting(username, "a-good-password");
  await logIn(page, admin);
  await openChangeLog(page);
  await expect(newest(page)).toHaveAccessibleName(
    new RegExp(`^\\d\\d:\\d\\d, Added Person ${username}: Role Waiting, by ${username}$`),
  );
});
