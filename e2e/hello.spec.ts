import { expect, test } from "@playwright/test";

test("the hello page loads at the /lola/ base", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByRole("heading", { name: "Hi Lola 👋" })).toBeVisible();
});
