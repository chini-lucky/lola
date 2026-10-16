import { expect, test } from "@playwright/test";
import { newUsername, signUpNanny } from "./api";
import { logIn } from "./login";

test("a nanny changes her password, logs out and logs back in with it", async ({ page }) => {
  const nanny = { username: newUsername("nanny"), password: "first-password" };
  await signUpNanny(nanny.username, nanny.password);
  await logIn(page, nanny);
  await page.getByRole("link", { name: "Account", exact: true }).click();
  await page.getByLabel("Current password").fill(nanny.password);
  await page.getByLabel("New password", { exact: true }).fill("second-password");
  await page.getByLabel("Repeat new password").fill("second-password");
  await page.getByRole("button", { name: "Change password" }).click();
  await expect(page.getByRole("status")).toHaveText("Password changed.");
  await page.getByRole("button", { name: "Log out" }).click();
  await logIn(page, { username: nanny.username, password: "second-password" });
  await expect(page.getByRole("heading", { name: `Hi ${nanny.username} 👋` })).toBeVisible();
});
