import { expect, test } from "@playwright/test";
import { newUsername, signUpNanny, signUpWaiting } from "./api";
import { logIn } from "./login";
import { admin } from "./logins";

test("reject removes a waiting sign-up", async ({ page }) => {
  const username = newUsername("reject");
  await signUpWaiting(username, "a-good-password");
  await logIn(page, admin);
  await page.getByRole("link", { name: "People" }).click();
  await page.getByRole("button", { name: `Reject ${username}` }).click();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Waiting for approval" })).toBeVisible();
  await expect(page.getByText(username)).toBeHidden();
});

test("an admin makes a nanny an admin", async ({ page }) => {
  const username = newUsername("promo");
  await signUpNanny(username, "a-good-password");
  await logIn(page, admin);
  await page.getByRole("link", { name: "People" }).click();
  const role = page.getByRole("group", { name: `Role for ${username}` });
  await role.getByRole("button", { name: "Admin" }).click();
  await page.reload();
  await expect(role.getByRole("button", { name: "Admin" })).toHaveAttribute("aria-pressed", "true");
});

test("remove deletes an approved person", async ({ page }) => {
  const username = newUsername("bye");
  await signUpNanny(username, "a-good-password");
  await logIn(page, admin);
  await page.getByRole("link", { name: "People" }).click();
  await page.getByRole("button", { name: `Remove ${username}` }).click();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Approved" })).toBeVisible();
  await expect(page.getByText(username)).toBeHidden();
});
