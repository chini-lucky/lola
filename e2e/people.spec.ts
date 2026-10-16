import { expect, test } from "@playwright/test";
import { newUsername, signUpWaiting } from "./api";
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
