import { expect, test, type Page } from "@playwright/test";

test("the login screen tells users to add Lola to the Home Screen", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByText("Add Lola to your Home Screen.")).toBeVisible();
});

async function appManifest(page: Page) {
  await page.goto("./");
  const cdp = await page.context().newCDPSession(page);
  return (await cdp.send("Page.getAppManifest", {})).manifest;
}

test("Chrome reads Lola as a standalone app that opens at /lola/", async ({ page }) => {
  const manifest = await appManifest(page);
  expect(manifest).toMatchObject({
    name: "Lola",
    display: "kStandalone",
    startUrl: expect.stringMatching(/\/lola\/$/),
  });
});

test("the manifest declares 192 and 512 pixel icons", async ({ page }) => {
  const manifest = await appManifest(page);
  expect((manifest.icons ?? []).map((icon) => icon.sizes)).toEqual(["192x192", "512x512"]);
});

test("the manifest icons and the Apple touch icon are served as PNGs", async ({ page }) => {
  const manifest = await appManifest(page);
  const touchIcon = new URL("apple-touch-icon.png", page.url()).href;
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
    "href",
    new URL(touchIcon).pathname,
  );
  const icons = [...(manifest.icons ?? []).map((icon) => icon.url), touchIcon];
  const types = await Promise.all(
    icons.map(async (url) => (await page.request.get(url)).headers()["content-type"]),
  );
  expect(types).toEqual(["image/png", "image/png", "image/png"]);
});
