// The CSV export (decisions.md): one file, one row per day of a range of pay periods. Pure.
import { datesIn, periodsThrough, type PayFacts, type Period } from "./pay";

const HEADER = [
  "Date",
  "Weekday",
  "Type",
  "OT times",
  "OT hours",
  "OT pay",
  "Note",
  "Payment",
  "Receipts",
];

/** One row per day from the first pay period through the last, CRLF line endings. */
export function exportCsv(first: Period, last: Period, facts: PayFacts): string {
  const dates = periodsThrough(last)
    .filter((period) => period.start >= first.start)
    .flatMap(datesIn);
  void facts;
  return [HEADER, ...dates.map((date) => [date])].map((row) => `${row.join(",")}\r\n`).join("");
}
