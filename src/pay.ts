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

/** The pay period ending on the 27th of this month (month may run past 12). */
function periodEnding(year: number, month: number): Period {
  const start = iso(year, month - 1, 28);
  return { start: start < START_DATE ? START_DATE : start, end: iso(year, month, 27) };
}

/** The pay period a date falls in, or null before the start date. */
export function periodOf(date: string): Period | null {
  if (date < START_DATE) return null;
  const [year, month, day] = parts(date);
  return periodEnding(year, day >= 28 ? month + 1 : month);
}

function addDays(date: string, days: number): string {
  const [year, month, day] = parts(date);
  return iso(year, month, day + days);
}

/** The pay period before this one, or null for the first pay period. */
export function prevPeriod(period: Period): Period | null {
  return periodOf(addDays(period.start, -1));
}

/** The pay period after this one. */
export function nextPeriod(period: Period): Period {
  const [year, month] = parts(period.end);
  return periodEnding(year, month + 1);
}
