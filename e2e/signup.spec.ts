import { expect, test } from "@playwright/test";

test("sign up refuses a username outside a–z, 0–9 and -", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("link", { name: "Create account" }).click();
  await page.getByLabel("Username").fill("Lola Bear");
  await page.getByLabel("Password", { exact: true }).fill("long-enough-pass");
  await page.getByLabel("Repeat password").fill("long-enough-pass");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("alert")).toHaveText(
    "Username must be 3–20 characters: a–z, 0–9 and -",
  );
});
