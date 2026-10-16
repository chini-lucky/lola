// All pay maths (docs/plan.md §4). Pure: no I/O, no clock. Dates are YYYY-MM-DD strings.

/** A pay period: the 28th of the previous month to the 27th, both inclusive. */
export interface Period {
  start: string;
  end: string;
}

/** The nanny's first day. Nothing exists before it. */
export const START_DATE = "2026-09-14";

function iso(year: number, month: number, day: number): string {
  return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10);
}

function parts(date: string): [number, number, number] {
  const [year = 0, month = 0, day = 0] = date.split("-").map(Number);
  return [year, month, day];
}

/** The pay period a date falls in. */
export function periodOf(date: string): Period {
  const [year, month, day] = parts(date);
  const endMonth = day >= 28 ? month + 1 : month;
  const start = iso(year, endMonth - 1, 28);
  return { start: start < START_DATE ? START_DATE : start, end: iso(year, endMonth, 27) };
}
