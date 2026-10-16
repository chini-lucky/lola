import { expect, test } from "@playwright/test";

test("the login screen tells users to add Lola to the Home Screen", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByText("Add Lola to your Home Screen.")).toBeVisible();
});

test("Chrome reads Lola as a standalone app that opens at /lola/", async ({ page, baseURL }) => {
  await page.goto("./");
  const cdp = await page.context().newCDPSession(page);
  const { manifest } = await cdp.send("Page.getAppManifest", {});
  expect(manifest).toMatchObject({ name: "Lola", display: "kStandalone", startUrl: baseURL });
});
