import { expect, test, type Page } from "@playwright/test";
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
