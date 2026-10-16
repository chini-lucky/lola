import { describe, expect, test } from "vitest";
import { exportCsv } from "./csv";
import type { PayFacts } from "./pay";

const sepPay = { start: "2026-09-14", end: "2026-09-27" };
const octPay = { start: "2026-09-28", end: "2026-10-27" };

const noFacts: PayFacts = {
  rates: [{ effective_from: "2026-09-14", salary: 20000, ot_rate: 150 }],
  overrides: [],
  holidays: [],
  days: [],
  payments: [],
};

/** The CSV's lines, without the header. */
const rowsOf = (csv: string) => csv.split("\r\n").slice(1, -1);

describe("CSV export", () => {
  test("Sep pay to Oct pay is one row per day, 14 Sep through 27 Oct", () => {
    const dates = rowsOf(exportCsv(sepPay, octPay, noFacts)).map((row) => row.slice(0, 10));
    expect([dates.length, dates[0], dates.at(-1)]).toEqual([44, "2026-09-14", "2026-10-27"]);
  });
});
