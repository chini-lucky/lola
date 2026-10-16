import { devices, expect, test } from "@playwright/test";
import { admin } from "./logins";

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

test("sign up refuses a password shorter than 10 characters", async ({ page }) => {
  await page.goto("./#/signup");
  await page.getByLabel("Username").fill("short-pass");
  await page.getByLabel("Password", { exact: true }).fill("123456789");
  await page.getByLabel("Repeat password").fill("123456789");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("alert")).toHaveText("Password must be at least 10 characters.");
});

test("a new sign-up waits until an admin approves them, then sees the home screen", async ({
  page,
  browser,
  baseURL,
}) => {
  const username = `new-${Date.now().toString(36)}`;
  await page.goto("./#/signup");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password", { exact: true }).fill("a-good-password");
  await page.getByLabel("Repeat password").fill("a-good-password");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Waiting for approval", { exact: true })).toBeVisible();

  const adminContext = await browser.newContext({ ...devices["Pixel 7"], baseURL: baseURL ?? "" });
  const adminPage = await adminContext.newPage();
  await adminPage.goto("./");
  await adminPage.getByLabel("Username").fill(admin.username);
  await adminPage.getByLabel("Password").fill(admin.password);
  await adminPage.getByRole("button", { name: "Log in" }).click();
  await adminPage.getByRole("link", { name: "Settings" }).click();
  await adminPage.getByRole("link", { name: "People" }).click();
  await adminPage.getByRole("button", { name: `Approve ${username}` }).click();
  await expect(adminPage.getByRole("button", { name: `Approve ${username}` })).toBeHidden();
  await adminContext.close();

  await page.reload();
  await expect(page.getByRole("heading", { name: `Hi ${username} 👋` })).toBeVisible();
});
