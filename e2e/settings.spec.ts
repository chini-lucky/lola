import { expect, test, type Page } from "@playwright/test";
import { deleteRate } from "./api";
import { logIn } from "./login";
import { admin } from "./logins";

async function openSettingsOn(page: Page, today: string) {
  await page.clock.setFixedTime(new Date(`${today}T10:00:00+07:00`));
  await logIn(page, admin);
  await page.getByRole("link", { name: "Settings" }).click();
}

test("Settings shows the rates in effect and the rate history with the agreed Sep pay", async ({
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
    await deleteRate("2027-03-28");
  });

  test("a raise from Apr pay changes Apr pay's salary, not Mar pay's", async ({ page }) => {
    await openSettingsOn(page, "2027-03-10");
    await page.getByLabel("New salary").fill("25,000");
    await page.getByLabel("Starts from").selectOption("Apr pay · 28 Mar – 27 Apr");
    await page.getByRole("button", { name: "Save new rate" }).click();
    await expect(page.getByRole("row", { name: "Apr pay (28 Mar 2027)" })).toHaveText(
      "Apr pay (28 Mar 2027)25,000150",
    );
    await page.getByRole("link", { name: "Back" }).click();
    await expect(page.getByRole("region", { name: "Mar pay · 28 Feb – 27 Mar" })).toContainText(
      "Salary20,000",
    );
    await page.getByRole("button", { name: "Next pay period" }).click();
    await expect(page.getByRole("region", { name: "Apr pay · 28 Mar – 27 Apr" })).toContainText(
      "Salary25,000",
    );
  });
});
