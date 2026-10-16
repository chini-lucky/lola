import { expect, test, type Page } from "@playwright/test";
import { nanny } from "./logins";
import { pdfLines } from "./pdf";

async function logInOn(page: Page, today: string, login: { username: string; password: string }) {
  await page.clock.setFixedTime(new Date(`${today}T10:00:00+07:00`));
  await page.goto("./");
  await page.getByLabel("Username").fill(login.username);
  await page.getByLabel("Password").fill(login.password);
  await page.getByRole("button", { name: "Log in" }).click();
}

/** Clicks Download payslip and returns the downloaded PDF's lines of text. */
async function downloadPayslip(page: Page): Promise<string[]> {
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download payslip" }).click();
  return pdfLines(await (await download).path());
}

test("Lola downloads the Oct pay payslip with every payslip field", async ({ page }) => {
  await logInOn(page, "2026-10-16", nanny);
  const lines = await downloadPayslip(page);
  expect(lines).toEqual(
    expect.arrayContaining([
      "Payslip · Oct pay (28 Sep – 27 Oct 2026)",
      "EMPLOYEE EMPLOYER",
      "Lola Chini Lucky",
      "Monthly salary (Mon–Fri 09:00–18:00) 20,000",
      "Wed 30 Sep 18:00–20:15 2.5 h 375",
      "Tue 20 Oct 07:00–08:00, 18:00–20:00 3 h 450",
      "Total overtime 15 h 2,250",
      "Tue 13 Oct Holiday · King Bhumibol Memorial Day",
      "Mon 19 Oct Leave · Sick day",
      "Fri 23 Oct Holiday · Chulalongkorn Day",
      "No payments yet 0",
      "Total due 22,250",
      "Paid 0",
      "Balance 22,250 THB",
      expect.stringMatching(/^Not yet confirmed by Lola Generated 16 Oct 2026 · /),
    ]),
  );
});
