import { describe, expect, test } from "vitest";
import { exportCsv } from "./csv";
import type { PayFacts, Payment } from "./pay";

const sepPay = { start: "2026-09-14", end: "2026-09-27" };
const octPay = { start: "2026-09-28", end: "2026-10-27" };

const noFacts: PayFacts = {
  rates: [{ effective_from: "2026-09-14", salary: 20000, ot_rate: 150 }],
  overrides: [],
  holidays: [],
  days: [],
  payments: [],
};

const sepPayPaid: Payment = {
  id: "p1",
  period_end: "2026-09-27",
  paid_on: "2026-09-28",
  amount: 11000,
  note: null,
  receipts: [],
};

/** The CSV's line for a date. */
function rowOn(date: string, facts: PayFacts): string | undefined {
  return rowsOf(exportCsv(octPay, octPay, facts)).find((row) => row.startsWith(date));
}

/** The CSV's lines, without the header. */
const rowsOf = (csv: string) => csv.split("\r\n").slice(1, -1);

describe("CSV export", () => {
  test("Sep pay to Oct pay is one row per day, 14 Sep through 27 Oct", () => {
    const dates = rowsOf(exportCsv(sepPay, octPay, noFacts)).map((row) => row.slice(0, 10));
    expect([dates.length, dates[0], dates.at(-1)]).toEqual([44, "2026-09-14", "2026-10-27"]);
  });

  test("an OT day shows its weekday, OT times, OT hours paid (rounded up) and OT pay", () => {
    const day = {
      date: "2026-10-20",
      ot: ["07:30-09:00", "18:00-19:10"],
      leave: false,
      note: null,
    };
    expect(rowOn("2026-10-20", { ...noFacts, days: [day] })).toBe(
      "2026-10-20,Tue,OT,07:30-09:00; 18:00-19:10,3,450,,,",
    );
  });

  test("a leave day shows its type and note", () => {
    const day = { date: "2026-10-19", ot: [], leave: true, note: "Doctor visit" };
    expect(rowOn("2026-10-19", { ...noFacts, days: [day] })).toBe(
      "2026-10-19,Mon,Leave,,,,Doctor visit,,",
    );
  });

  test("a payment's amount shows on the day it was paid, not in the pay period it is for", () => {
    expect(rowOn("2026-09-28", { ...noFacts, payments: [sepPayPaid] })).toBe(
      "2026-09-28,Mon,Normal,,,,,11000,",
    );
  });

  test("a payment's receipts show by the file names they were attached with", () => {
    const receipts = ["2026-09-27/p1/1a2b3c4d-slip.jpg", "2026-09-27/p1/5e6f7a8b-transfer.pdf"];
    expect(rowOn("2026-09-28", { ...noFacts, payments: [{ ...sepPayPaid, receipts }] })).toBe(
      "2026-09-28,Mon,Normal,,,,,11000,slip.jpg; transfer.pdf",
    );
  });
});
