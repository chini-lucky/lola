import { expect, test, type Page } from "@playwright/test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loggedIn } from "./api";
import { admin, nanny } from "./logins";

async function logInOn(page: Page, today: string, login: { username: string; password: string }) {
  await page.clock.setFixedTime(new Date(`${today}T10:00:00+07:00`));
  await page.goto("./");
  await page.getByLabel("Username").fill(login.username);
  await page.getByLabel("Password").fill(login.password);
  await page.getByRole("button", { name: "Log in" }).click();
}

/** Opens Dec pay (28 Nov – 27 Dec), two pay periods after today's Oct pay. */
async function openDecPay(page: Page, login: { username: string; password: string }) {
  await logInOn(page, "2026-10-16", login);
  await page.getByRole("button", { name: "Next pay period" }).click();
  await page.getByRole("button", { name: "Next pay period" }).click();
  await expect(page.getByRole("region", { name: "Dec pay · 28 Nov – 27 Dec" })).toBeVisible();
}

// Confirmations can't be deleted, so each run pays Dec pay a different amount: Lola's
// confirmation from an earlier run then no longer matches and she can confirm again.
let asAdmin: SupabaseClient;
let paymentId: string;
test.beforeEach(async () => {
  asAdmin = await loggedIn(admin.username, admin.password);
  const amount = 1 + (Date.now() % 9000);
  const { data, error } = await asAdmin
    .from("payments")
    .insert({ period_end: "2026-12-27", paid_on: "2026-10-16", amount, note: "confirm test" })
    .select("id")
    .single<{ id: string }>();
  if (error !== null) throw error;
  paymentId = data.id;
});
test.afterEach(async () => {
  const payment = await asAdmin.from("payments").delete().eq("id", paymentId);
  if (payment.error !== null) throw payment.error;
  const day = await asAdmin.from("days").delete().eq("date", "2026-12-05");
  if (day.error !== null) throw day.error;
});

test("Lola confirms a pay period and the admin sees Lola confirmed", async ({ page, browser }) => {
  await openDecPay(page, nanny);
  await page.getByRole("button", { name: "This looks right" }).click();
  await expect(page.getByText(/^You confirmed this on \d+ \w+$/)).toBeVisible();

  const adminPage = await browser.newPage();
  await openDecPay(adminPage, admin);
  await expect(adminPage.getByText(/^Lola confirmed \d+ \w+$/)).toBeVisible();
});

test("the admin changing OT after Lola confirmed shows Changed since Lola confirmed", async ({
  page,
  browser,
}) => {
  await openDecPay(page, nanny);
  await page.getByRole("button", { name: "This looks right" }).click();
  await expect(page.getByText(/^You confirmed this on/)).toBeVisible();

  // Sat 5 Dec, 10:00–12:00: 2 h OT = 300, so the total goes from 20,000 to 20,300.
  const { error } = await asAdmin.from("days").insert({ date: "2026-12-05", ot: ["10:00-12:00"] });
  if (error !== null) throw error;

  const adminPage = await browser.newPage();
  await openDecPay(adminPage, admin);
  const flag = adminPage.getByRole("note", { name: "Changed since Lola confirmed" });
  await expect(flag).toContainText(
    /She checked total 20,000 · paid [\d,]+ on \d+ \w+\. Now total 20,300 · paid [\d,]+\./,
  );
});

test("Copy summary puts the pay period summary and a link on the clipboard", async ({
  page,
  context,
  baseURL,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await logInOn(page, "2026-10-16", admin);
  await page.getByRole("button", { name: "Copy summary" }).click();
  await expect(page.getByRole("status")).toHaveText("Summary copied");
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toBe(
    [
      "Lola · Oct pay (28 Sep – 27 Oct)",
      "Salary 20,000",
      "OT 15 h = 2,250",
      "Total 22,250 · Paid 0",
      "Balance 22,250 THB",
      baseURL,
    ].join("\n"),
  );
});
