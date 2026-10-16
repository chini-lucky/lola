import { expect, test } from "@playwright/test";
import { newUsername, signUpNanny } from "./api";
import { logIn } from "./login";
import { admin } from "./logins";

test("a nanny changes her password, logs out and logs back in with it", async ({ page }) => {
  const nanny = { username: newUsername("nanny"), password: "first-password" };
  await signUpNanny(nanny.username, nanny.password);
  await logIn(page, nanny);
  await page.getByRole("link", { name: /^Account/ }).click();
  await page.getByLabel("Current password").fill(nanny.password);
  await page.getByLabel("New password", { exact: true }).fill("second-password");
  await page.getByLabel("Repeat new password").fill("second-password");
  await page.getByRole("button", { name: "Change password" }).click();
  await expect(page.getByRole("status")).toHaveText("Password changed.");
  await page.getByRole("button", { name: "Log out" }).click();
  await logIn(page, { username: nanny.username, password: "second-password" });
  await expect(page.getByRole("heading", { name: `Hi ${nanny.username} 👋` })).toBeVisible();
});

test("a new password shorter than 10 characters is refused", async ({ page }) => {
  await logIn(page, admin);
  await page.getByRole("link", { name: /^Account/ }).click();
  await page.getByLabel("Current password").fill(admin.password);
  await page.getByLabel("New password", { exact: true }).fill("123456789");
  await page.getByLabel("Repeat new password").fill("123456789");
  await page.getByRole("button", { name: "Change password" }).click();
  await expect(page.getByRole("alert")).toHaveText("Password must be at least 10 characters.");
});
