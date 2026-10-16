import { expect, test } from "@playwright/test";

test("the login screen tells users to add Lola to the Home Screen", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByText("Add Lola to your Home Screen.")).toBeVisible();
});
