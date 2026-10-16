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

/** Money paid to the nanny, recorded for a pay period it chooses (not the one its date falls in). */
export interface Payment {
  id: string;
  period_end: string;
  paid_on: string;
  amount: number;
  note: string | null;
  /** Storage paths of its receipt files. */
  receipts: string[];
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

/** Every pay period from the first one through this one, in order. */
export function periodsThrough(last: Period): Period[] {
  const periods: Period[] = [];
  for (let p = currentPeriod(START_DATE); p.end <= last.end; p = nextPeriod(p)) periods.push(p);
  return periods;
}

/** The rate in effect on a date: the latest one starting on or before it. */
export function rateOn(date: string, rates: Rate[]): Rate {
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

function isWeekend(date: string): boolean {
  const weekday = weekdayOf(date);
  return weekday === 0 || weekday === 6;
}

export type DayKind = "ot" | "leave" | "holiday" | "weekend" | "normal";

/** How a day shows on the calendar: OT > leave > holiday > weekend > normal. */
export function dayKind(date: string, holidays: string[], day?: Day): DayKind {
  if (day !== undefined && day.ot.length > 0) return "ot";
  if (day?.leave === true) return "leave";
  if (holidays.includes(date)) return "holiday";
  return isWeekend(date) ? "weekend" : "normal";
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

/**
 * A day's OT: the minutes counted, the minutes paid (the day's total rounded up to the
 * next 30 minutes) and their pay.
 */
export interface DayOt {
  countedMinutes: number;
  paidMinutes: number;
  pay: number;
}

const toMinutes = (time: string) => {
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

/** Normal hours on a weekday: 09:00–18:00. */
const DAY_START = toMinutes("09:00");
const DAY_END = toMinutes("18:00");

/** A range "07:00-19:00" as minutes since midnight. */
function rangeOf(range: string): [number, number] {
  const [from = 0, to = 0] = range.split("-").map(toMinutes);
  return [from, to];
}

/**
 * Minutes of a range that count as OT: all of it on a weekend or holiday,
 * else only before 09:00 or after 18:00.
 */
function otMinutesOf(range: string, weekendOrHoliday: boolean): number {
  const [from, to] = rangeOf(range);
  if (weekendOrHoliday) return to - from;
  const before = Math.max(0, Math.min(to, DAY_START) - from);
  const after = Math.max(0, to - Math.max(from, DAY_END));
  return before + after;
}

/** The day's OT, paid at the OT rate in effect that day, in whole baht. */
export function dayOt(day: Day, rates: Rate[], holidays: string[]): DayOt {
  const weekendOrHoliday = isWeekend(day.date) || holidays.includes(day.date);
  const countedMinutes = day.ot.reduce(
    (sum, range) => sum + otMinutesOf(range, weekendOrHoliday),
    0,
  );
  const paidMinutes = Math.ceil(countedMinutes / 30) * 30;
  return {
    countedMinutes,
    paidMinutes,
    pay: Math.round((paidMinutes * rateOn(day.date, rates).ot_rate) / 60),
  };
}

/** Why a day's OT counts: "Saturday", "Sunday", "Holiday", or "Before 09:00 + After 18:00". */
export function otReason(day: Day, holidays: string[]): string {
  const weekday = weekdayOf(day.date);
  if (weekday === 6) return "Saturday";
  if (weekday === 0) return "Sunday";
  if (holidays.includes(day.date)) return "Holiday";
  const ranges = day.ot.map(rangeOf);
  const reasons = [
    ranges.some(([from]) => from < DAY_START) ? "Before 09:00" : null,
    ranges.some(([, to]) => to > DAY_END) ? "After 18:00" : null,
  ];
  return reasons.filter((reason) => reason !== null).join(" + ");
}

/** The exception days that fall in the pay period. */
export function daysIn(period: Period, days: Day[]): Day[] {
  return days.filter((day) => day.date >= period.start && day.date <= period.end);
}

/**
 * Everything the pay maths needs, as stored: rates, agreed overrides, holiday dates,
 * exception days, payments.
 */
export interface PayFacts {
  rates: Rate[];
  overrides: PeriodOverride[];
  holidays: string[];
  days: Day[];
  payments: Payment[];
}

/** A pay period's money: total = salary plus the OT of its days; balance = total − paid. */
export interface Summary {
  salary: number;
  otMinutes: number;
  otPay: number;
  total: number;
  paid: number;
  balance: number;
}

export function summarize(period: Period, facts: PayFacts): Summary {
  const salary = salaryOf(period, facts.rates, facts.overrides);
  let otMinutes = 0;
  let otPay = 0;
  for (const day of daysIn(period, facts.days)) {
    const ot = dayOt(day, facts.rates, facts.holidays);
    otMinutes += ot.paidMinutes;
    otPay += ot.pay;
  }
  const total = salary + otPay;
  const paid = paymentsIn(period, facts.payments).reduce((sum, p) => sum + p.amount, 0);
  return { salary, otMinutes, otPay, total, paid, balance: total - paid };
}

/** The pay period's own payments, by date paid. */
export function paymentsIn(period: Period, payments: Payment[]): Payment[] {
  return payments
    .filter((p) => p.period_end === period.end)
    .sort((a, b) => a.paid_on.localeCompare(b.paid_on));
}
