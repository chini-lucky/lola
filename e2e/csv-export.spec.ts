import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { logIn } from "./login";
import { admin } from "./logins";

test("the admin exports Sep pay to Oct pay as one CSV with a row per day", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-10-16T10:00:00+07:00"));
  await logIn(page, admin);
  await page.getByRole("link", { name: "Settings" }).click();
  const exportCsv = page.getByRole("region", { name: "Export CSV" });
  await exportCsv.getByLabel("From").selectOption("Sep pay 2026");
  await exportCsv.getByLabel("To", { exact: true }).selectOption("Oct pay 2026");
  const download = page.waitForEvent("download");
  await exportCsv.getByRole("button", { name: "Download CSV" }).click();
  const lines = (await readFile(await (await download).path(), "utf8")).split("\r\n");
  expect({ header: lines[0], days: lines.slice(1, -1).length }).toEqual({
    header: "﻿Date,Weekday,Type,OT times,OT hours,OT pay,Note,Payment,Receipts",
    days: 44,
  });
});
