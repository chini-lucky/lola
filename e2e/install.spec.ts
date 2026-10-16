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

test("the bear icons in the manifest and the Apple touch icon are served", async ({ page }) => {
  await page.goto("./");
  const cdp = await page.context().newCDPSession(page);
  const { manifest } = await cdp.send("Page.getAppManifest", {});
  const manifestIcons = manifest.icons ?? [];
  const touchIcon = await page.locator('link[rel="apple-touch-icon"]').getAttribute("href");
  const icons = [...manifestIcons.map((icon) => icon.url), touchIcon ?? ""];
  const types = await Promise.all(
    icons.map(async (url) => (await page.request.get(url)).headers()["content-type"]),
  );
  expect({ sizes: manifestIcons.map((icon) => icon.sizes), types }).toEqual({
    sizes: ["192x192", "512x512"],
    types: ["image/png", "image/png", "image/png"],
  });
});
