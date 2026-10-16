// The CSV export (decisions.md): one file, one row per day of a range of pay periods. Pure.
import {
  datesIn,
  dayKind,
  dayOt,
  periodsThrough,
  type DayKind,
  type PayFacts,
  type Period,
} from "./pay";
import { receiptName } from "./receipts";
import { weekdayName } from "./format";

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

function typeLabel(kind: DayKind): string {
  switch (kind) {
    case "ot":
      return "OT";
    case "leave":
      return "Leave";
    case "holiday":
      return "Holiday";
    case "weekend":
      return "Weekend";
    case "normal":
      return "Normal";
    default: {
      const unreachable: never = kind;
      return unreachable;
    }
  }
}

function rowOn(date: string, facts: PayFacts): string[] {
  const day = facts.days.find((d) => d.date === date);
  const kind = dayKind(date, facts.holidays, day);
  const ot =
    day !== undefined && day.ot.length > 0 ? dayOt(day, facts.rates, facts.holidays) : null;
  const paid = facts.payments.filter((p) => p.paid_on === date);
  return [
    date,
    weekdayName(date),
    typeLabel(kind),
    day?.ot.join("; ") ?? "",
    ot === null ? "" : (ot.paidMinutes / 60).toString(),
    ot === null ? "" : ot.pay.toString(),
    day?.note ?? "",
    paid.length === 0 ? "" : paid.reduce((sum, p) => sum + p.amount, 0).toString(),
    paid.flatMap((p) => p.receipts.map(receiptName)).join("; "),
  ];
}

/** A field as CSV: quoted, its quotes doubled, if it holds a comma, quote or line break. */
const field = (text: string) => (/[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text);

/** One row per day from the first pay period through the last, CRLF line endings. */
export function exportCsv(first: Period, last: Period, facts: PayFacts): string {
  const dates = periodsThrough(last)
    .filter((period) => period.start >= first.start)
    .flatMap(datesIn);
  return [HEADER, ...dates.map((date) => rowOn(date, facts))]
    .map((row) => `${row.map(field).join(",")}\r\n`)
    .join("");
}
