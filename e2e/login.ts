import type { Page } from "@playwright/test";

/** Logs in through the login screen. */
export async function logIn(page: Page, who: { username: string; password: string }) {
  await page.goto("./");
  await page.getByLabel("Username").fill(who.username);
  await page.getByLabel("Password").fill(who.password);
  await page.getByRole("button", { name: "Log in" }).click();
}
