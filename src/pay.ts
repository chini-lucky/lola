// All pay maths (docs/plan.md §4). Pure: no I/O, no clock. Dates are YYYY-MM-DD strings.

/** A pay period: the 28th of the previous month to the 27th, both inclusive. */
export interface Period {
  start: string;
  end: string;
}

/** The nanny's first day. Nothing exists before it. */
const START_DATE = "2026-09-14";

/** Salary per pay period and OT per hour, in effect from a date until the next rate. */
export interface Rate {
  effective_from: string;
  salary: number;
  ot_rate: number;
}

/** An agreed salary for one pay period instead of the rate (the first pay period: 11,000). */
export interface PeriodOverride {
  period_end: string;
  salary: number;
  note: string | null;
}

function iso(year: number, month: number, day: number): string {
  return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10);
}

function parts(date: string): [number, number, number] {
  const [year = 0, month = 0, day = 0] = date.split("-").map(Number);
  return [year, month, day];
}

/** Day of the week: 0 = Sunday … 6 = Saturday. */
export function weekdayOf(date: string): number {
  const [year, month, day] = parts(date);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/** The pay period ending on the 27th of this month (month may run past 12). */
function periodEnding(year: number, month: number): Period {
  const start = iso(year, month - 1, 28);
  return { start: start < START_DATE ? START_DATE : start, end: iso(year, month, 27) };
}

function periodContaining(date: string): Period {
  const [year, month, day] = parts(date);
  return periodEnding(year, day >= 28 ? month + 1 : month);
}

/** The pay period a date falls in, or null before the start date. */
export function periodOf(date: string): Period | null {
  return date < START_DATE ? null : periodContaining(date);
}

/** The pay period to show first: today's, or the first one before the start date. */
export function currentPeriod(today: string): Period {
  return periodContaining(today < START_DATE ? START_DATE : today);
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

/** The rate in effect on a date: the latest one starting on or before it. */
function rateOn(date: string, rates: Rate[]): Rate {
  let inEffect: Rate | undefined;
  for (const rate of rates) {
    if (rate.effective_from <= date && rate.effective_from > (inEffect?.effective_from ?? "")) {
      inEffect = rate;
    }
  }
  if (inEffect === undefined) throw new Error(`No rate in effect on ${date}`);
  return inEffect;
}

/** The pay period's agreed salary override, if there is one. */
export function overrideOf(period: Period, overrides: PeriodOverride[]): PeriodOverride | null {
  return overrides.find((o) => o.period_end === period.end) ?? null;
}

/** The pay period's salary: its override if agreed, else the salary in effect on its start. */
export function salaryOf(period: Period, rates: Rate[], overrides: PeriodOverride[]): number {
  const override = overrideOf(period, overrides);
  if (override !== null) return override.salary;
  return rateOn(period.start, rates).salary;
}

/** Every date in the pay period, in order. */
export function datesIn(period: Period): string[] {
  const dates: string[] = [];
  for (let date = period.start; date <= period.end; date = addDays(date, 1)) dates.push(date);
  return dates;
}

export type DayKind = "holiday" | "weekend" | "normal";

/** How a day shows on the calendar. */
export function dayKind(date: string, holidays: string[]): DayKind {
  if (holidays.includes(date)) return "holiday";
  const weekday = weekdayOf(date);
  return weekday === 0 || weekday === 6 ? "weekend" : "normal";
}

/** Pay day: the 28th, the day after the pay period ends. */
export function payDayOf(period: Period): string {
  return addDays(period.end, 1);
}

/** An exception day the admin recorded: OT ranges ("18:00-20:30"), leave, a note. */
export interface Day {
  date: string;
  ot: string[];
  leave: boolean;
  note: string | null;
}

/** A day's OT: the minutes paid (the day's total rounded up to the next 30 minutes). */
export interface DayOt {
  minutes: number;
}

const toMinutes = (time: string) => {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

function rangeMinutes(range: string): number {
  const [from = "", to = ""] = range.split("-");
  return toMinutes(to) - toMinutes(from);
}

export function dayOt(day: Day): DayOt {
  const counted = day.ot.reduce((sum, range) => sum + rangeMinutes(range), 0);
  return { minutes: Math.ceil(counted / 30) * 30 };
}
