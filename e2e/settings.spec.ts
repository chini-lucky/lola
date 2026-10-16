import { expect, test, type Page } from "@playwright/test";
import { asAdmin } from "./api";
import { logIn } from "./login";
import { admin } from "./logins";

async function openSettingsOn(page: Page, today: string) {
  await page.clock.setFixedTime(new Date(`${today}T10:00:00+07:00`));
  await logIn(page, admin);
  await page.getByRole("link", { name: "Settings" }).click();
}

test("the rates in effect are the latest ones started; the history lists every rate and the agreed Sep pay", async ({
  page,
}) => {
  await openSettingsOn(page, "2026-10-16");
  const rates = page.getByRole("region", { name: "Pay rates" });
  await expect(rates).toContainText("Salary / month20,000");
  await expect(rates).toContainText("OT / hour150");
  await expect(rates.getByRole("row")).toHaveText([
    "From periodSalaryOT",
    "Sep pay (14 Sep 2026)20,000150",
    "Sep pay fixed at 11,000 (first part-month, agreed)11,000–",
  ]);
});

test.describe("a raise", () => {
  test.afterEach(async () => {
    await asAdmin((db) => db.from("rates").delete().eq("effective_from", "2027-03-28"));
  });

  test("a raise from Apr pay changes Apr pay's total, not Mar pay's", async ({ page }) => {
    await openSettingsOn(page, "2027-03-10");
    await page.getByLabel("New salary").fill("25,000");
    await page.getByLabel("Starts from").selectOption("Apr pay · 28 Mar – 27 Apr");
    await page.getByRole("button", { name: "Save new rate" }).click();
    await expect(page.getByRole("row", { name: "Apr pay (28 Mar 2027)" })).toHaveText(
      "Apr pay (28 Mar 2027)25,000150",
    );
    await page.getByRole("link", { name: "Back" }).click();
    await expect(page.getByRole("region", { name: "Mar pay · 28 Feb – 27 Mar" })).toContainText(
      "Total20,000",
    );
    await page.getByRole("button", { name: "Next pay period" }).click();
    await expect(page.getByRole("region", { name: "Apr pay · 28 Mar – 27 Apr" })).toContainText(
      "Total25,000",
    );
  });
});

test.describe("holidays", () => {
  test.afterEach(async () => {
    await asAdmin((db) => db.from("days").delete().eq("date", "2027-03-17"));
    await asAdmin((db) => db.from("holidays").delete().eq("date", "2027-03-17"));
  });

  async function addHoliday(page: Page) {
    await page.getByRole("button", { name: "Add holiday" }).click();
    await page.getByLabel("Date").fill("2027-03-17");
    await page.getByLabel("Name").fill("Pooh day");
    await page.getByRole("button", { name: "Save holiday" }).click();
    await expect(page.getByRole("button", { name: "Remove Pooh day, 17 Mar 2027" })).toBeVisible();
  }

  test("an added holiday shows on the calendar; once removed it is a normal day again", async ({
    page,
  }) => {
    await openSettingsOn(page, "2027-03-10");
    await addHoliday(page);
    await page.getByRole("link", { name: "Back" }).click();
    await expect(page.getByRole("listitem", { name: "Wed 17 Mar, holiday" })).toBeVisible();

    await page.getByRole("link", { name: "Settings" }).click();
    await page.getByRole("button", { name: "Remove Pooh day, 17 Mar 2027" }).click();
    await expect(page.getByText("Pooh day")).toBeHidden();
    await page.getByRole("link", { name: "Back" }).click();
    await expect(page.getByRole("listitem", { name: "Wed 17 Mar", exact: true })).toBeVisible();
  });

  test("work during normal hours on an added holiday counts as OT", async ({ page }) => {
    await asAdmin((db) => db.from("days").insert({ date: "2027-03-17", ot: ["10:00-12:00"] }));
    await openSettingsOn(page, "2027-03-10");
    await addHoliday(page);
    await page.getByRole("link", { name: "Back" }).click();
    await expect(page.getByRole("region", { name: "Mar pay · 28 Feb – 27 Mar" })).toContainText(
      "Overtime 2 h",
    );
  });
});
