import { expect, test, type Page } from "@playwright/test";
import { asAdmin } from "./api";
import { logIn } from "./login";
import { admin } from "./logins";

// Nov pay (28 Oct – 27 Nov 2026) has no seeded days; each test starts it empty.
test.beforeEach(async () => {
  await asAdmin((db) =>
    db.from("days").delete().gte("date", "2026-10-28").lte("date", "2026-11-27"),
  );
});

async function openChangeLog(page: Page) {
  await page.getByRole("link", { name: "Settings" }).click();
  await page.getByRole("link", { name: "Change log" }).click();
}

/** The change log's newest entry. */
const newest = (page: Page) =>
  page
    .getByRole("list", { name: /^Changes / })
    .first()
    .getByRole("listitem")
    .first();

test("an admin's day edit shows first in the change log with its before and after", async ({
  page,
}) => {
  await asAdmin((db) => db.from("days").insert({ date: "2026-11-17", ot: ["18:00-19:00"] }));
  await page.clock.setFixedTime(new Date("2026-11-16T10:00:00+07:00"));
  await logIn(page, admin);
  await page
    .getByRole("list", { name: "Days" })
    .getByRole("button", { name: "Edit Tue 17 Nov" })
    .click();
  const sheet = page.getByRole("dialog", { name: "Tue 17 Nov" });
  await sheet.getByLabel("Range 1 to").fill("19:10");
  await sheet.getByRole("button", { name: "Save day" }).click();
  await expect(sheet).toBeHidden();

  await openChangeLog(page);
  await expect(newest(page)).toHaveAccessibleName(
    /^\d\d:\d\d, Changed Day Tue 17 Nov: OT 18:00–19:00 → 18:00–19:10, by chini-lucky$/,
  );
});
