import { useState, type ReactNode } from "react";
import {
  currentPeriod,
  datesIn,
  dayKind,
  dayOt,
  daysIn,
  isStale,
  snapshotOf,
  nextPeriod,
  otReason,
  overrideOf,
  paymentsIn,
  periodOf,
  periodsThrough,
  rateOn,
  summarize,
  weekdayOf,
  type Day,
  type DayKind,
  type Payment,
  type PayFacts,
  type Period,
  type Rate,
  type Snapshot,
  type Summary,
} from "./pay";
import { exportCsv } from "./csv";
import { weekdayName } from "./format";
import { isPdf, receiptName } from "./receipts";
import type { Confirmation, Holiday, Role } from "./supabase";

export { weekdayName };

/** The original brown baby bear mascot with a bow tie. */
export function Bear({ className }: { className: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" aria-hidden="true">
      <circle cx="31" cy="35" r="16" fill="var(--bear)" />
      <circle cx="89" cy="35" r="16" fill="var(--bear)" />
      <circle cx="31" cy="35" r="8.5" fill="var(--bear-lt)" />
      <circle cx="89" cy="35" r="8.5" fill="var(--bear-lt)" />
      <ellipse cx="60" cy="64" rx="41" ry="37" fill="var(--bear)" />
      <path
        d="M55 29 q5 -9 10 -2 q-4 -1 -5 4"
        fill="none"
        stroke="var(--bear-dk)"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <ellipse cx="33" cy="76" rx="7" ry="4.5" fill="var(--cheek)" opacity=".65" />
      <ellipse cx="87" cy="76" rx="7" ry="4.5" fill="var(--cheek)" opacity=".65" />
      <ellipse cx="60" cy="79" rx="18" ry="13.5" fill="var(--bear-lt)" />
      <circle cx="44" cy="61" r="4.8" fill="var(--bear-dk)" />
      <circle cx="76" cy="61" r="4.8" fill="var(--bear-dk)" />
      <circle cx="45.6" cy="59.4" r="1.6" fill="#fff" />
      <circle cx="77.6" cy="59.4" r="1.6" fill="#fff" />
      <ellipse cx="60" cy="73" rx="6.5" ry="4.6" fill="var(--bear-dk)" />
      <path
        d="M60 77.5 v4 M60 81.5 q-4.5 3.5 -8 0 M60 81.5 q4.5 3.5 8 0"
        fill="none"
        stroke="var(--bear-dk)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M60 104 L45 96 L45 112 Z M60 104 L75 96 L75 112 Z"
        fill="var(--bow)"
        stroke="var(--bow)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle cx="60" cy="104" r="4.5" fill="var(--bow)" />
      <circle cx="60" cy="104" r="2" fill="#ffffff" opacity=".5" />
    </svg>
  );
}

/** A labelled text or password input, with optional help text under it. */
export function Field(props: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "password" | "date";
  inputMode?: "numeric";
  autoComplete: string;
  help?: string;
}) {
  return (
    <div className="field">
      <label htmlFor={props.id}>{props.label}</label>
      <input
        className="inp"
        id={props.id}
        type={props.type ?? "text"}
        inputMode={props.inputMode}
        autoComplete={props.autoComplete}
        autoCapitalize="none"
        spellCheck={false}
        value={props.value}
        onChange={(event) => {
          props.onChange(event.target.value);
        }}
      />
      {props.help !== undefined && <span className="help">{props.help}</span>}
    </div>
  );
}

export function Plus() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden="true">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

/** Sub-page header: Back to home, then the page title. */
export function BackBar({ title }: { title: string }) {
  return (
    <div className="bar">
      <a className="iconbtn" href="#/" aria-label="Back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
          <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
      <b>{title}</b>
    </div>
  );
}

export function ErrorAlert({ message }: { message: string | null }) {
  if (message === null) return null;
  return (
    <p className="err" role="alert">
      {message}
    </p>
  );
}

export function roleLabel(role: Role): string {
  switch (role) {
    case "admin":
      return "Admin";
    case "nanny":
      return "Nanny";
    case "waiting":
      return "Waiting";
    default: {
      const unreachable: never = role;
      return unreachable;
    }
  }
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Oct" for any date in October. */
export const monthName = (date: string) => MONTHS[Number(date.slice(5, 7)) - 1] ?? "";
const dayOfMonth = (date: string) => Number(date.slice(8, 10));
/** "28 Sep" */
export const dayMonth = (date: string) => `${dayOfMonth(date).toString()} ${monthName(date)}`;
/** "17 Mar 2027" */
export const fullDate = (date: string) => `${dayMonth(date)} ${date.slice(0, 4)}`;
/** "Oct pay" */
export const periodName = (period: Period) => `${monthName(period.end)} pay`;
/** "Oct pay · 28 Sep – 27 Oct" */
export const periodTitle = (period: Period) =>
  `${periodName(period)} · ${dayMonth(period.start)} – ${dayMonth(period.end)}`;
/** A moment's date in Bangkok, YYYY-MM-DD. */
export const bangkokDate = (at: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(at);
/** Today's date in Bangkok. */
export const todayInBangkok = () => bangkokDate(new Date());
/** "16 Oct": the Bangkok day a confirmation was made. */
const confirmedOn = (confirmation: Confirmation) =>
  dayMonth(bangkokDate(new Date(confirmation.confirmed_at)));
/** "total 22,250 · paid 0": the money numbers a confirmation checked, or as they are now. */
const checked = ({ total, paid }: Snapshot) => `total ${money(total)} · paid ${money(paid)}`;
/** Whole baht with thousands separators: "20,000". */
export const money = (amount: number) => amount.toLocaleString("en-US");
/** "Tue 20 Oct" */
export const dayLabel = (date: string) => `${weekdayName(date)} ${dayMonth(date)}`;
/** OT minutes as hours: "2.5 h". */
export const hours = (minutes: number) => `${(minutes / 60).toString()} h`;
/** OT minutes as hours in a calendar cell: "2.5h". */
const hoursShort = (minutes: number) => `${(minutes / 60).toString()}h`;
/** Minutes as "1h 10m". */
function hoursMinutes(minutes: number): string {
  const rest = minutes % 60;
  return `${Math.floor(minutes / 60).toString()}h${rest === 0 ? "" : ` ${rest.toString()}m`}`;
}

/** The pay period's totals card, with the bear peeking over it. */
export function Totals({ period, facts }: { period: Period; facts: PayFacts }) {
  const { salary, otMinutes, otPay, total, paid, balance } = summarize(period, facts);
  const agreed = overrideOf(period, facts.overrides)?.note ?? null;
  return (
    <div className="totals">
      <Bear className="peek" />
      <div>
        <div className="lbl">{periodName(period)} total</div>
        <div className="big">
          {money(total)}
          <small>THB</small>
        </div>
      </div>
      <dl className="rows">
        <dt>{agreed === null ? "Salary" : `Salary (${agreed})`}</dt>
        <dd>{money(salary)}</dd>
        <dt>Overtime {hours(otMinutes)}</dt>
        <dd>{money(otPay)}</dd>
        <div className="sep" />
        <dt>Total</dt>
        <dd>{money(total)}</dd>
        <dt>Paid</dt>
        <dd>{money(paid)}</dd>
      </dl>
      {/* THB, not ฿: the self-hosted fonts are latin only. */}
      <div className={balance === 0 ? "bal paid" : "bal"}>
        <span>{balance === 0 ? "Fully paid" : "Balance to pay"}</span>
        <span>{money(balance)} THB</span>
      </div>
    </div>
  );
}

export function Pen() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
      <path d="M4 20h4L19 9l-4-4L4 16z" strokeLinejoin="round" />
      <path d="M14 6l4 4" strokeLinecap="round" />
    </svg>
  );
}

function Download() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
      <path d="M12 4v11M7 10.5l5 5 5-5M5 20h14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** A receipt tile's corner button that takes it off the payment. */
export function RemoveReceipt(props: { name: string; onClick: () => void }) {
  return (
    <button className="x" type="button" aria-label={`Remove ${props.name}`} onClick={props.onClick}>
      <Cross />
    </button>
  );
}

/**
 * A receipt as a small tile with its name under it: the image itself when there is a link to
 * it (a PDF, or an image the browser can't show, is drawn as a sheet of paper), and the tile's
 * corner button.
 */
export function Receipt(props: { name: string; link: string | null; children?: ReactNode }) {
  const { name, link } = props;
  const [undrawable, setUndrawable] = useState(false); // e.g. HEIC outside Safari
  const face =
    link === null || isPdf(name) || undrawable ? (
      <>
        <i />
        <i />
        <i />
        <i />
        {isPdf(name) && <span className="tag">PDF</span>}
      </>
    ) : (
      <img
        src={link}
        alt=""
        onError={() => {
          setUndrawable(true);
        }}
      />
    );
  return (
    <div className="rcw">
      <div className="rc">
        {link === null ? (
          face
        ) : (
          <a
            className="face"
            href={link}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open ${name}`}
          >
            {face}
          </a>
        )}
        {props.children}
      </div>
      <span>{name}</span>
    </div>
  );
}

const receiptCount = (count: number) =>
  `${count.toString()} ${count === 1 ? "receipt" : "receipts"}`;

/**
 * The pay period's payments by date paid, each with its receipts to open and download, and an
 * edit pen for the admin.
 */
export function Payments(props: {
  period: Period;
  facts: PayFacts;
  /** Links to view the period's receipts, by path. */
  links: Map<string, string>;
  onDownload: (path: string) => void;
  onEdit: ((payment: Payment) => void) | null;
}) {
  const { period, facts, onEdit } = props;
  const payments = paymentsIn(period, facts.payments);
  const { paid } = summarize(period, facts);
  return (
    <div className="list">
      <h3>
        Payments<small>{money(paid)} paid</small>
      </h3>
      {payments.length === 0 ? (
        <div className="empty">
          <b>No payments for {monthName(period.end)} pay yet</b>
        </div>
      ) : (
        <ul className="items" aria-label="Payments">
          {payments.map((payment) => (
            <li className="payment" key={payment.id}>
              <div className="item">
                <div className="chip pay">
                  <small>{weekdayName(payment.paid_on)}</small>
                  <b>{dayOfMonth(payment.paid_on)}</b>
                </div>
                <div className="what">
                  <b>{payment.note ?? "Payment"}</b>
                  <small>
                    Paid {dayMonth(payment.paid_on)}
                    {payment.receipts.length > 0 && ` · ${receiptCount(payment.receipts.length)}`}
                  </small>
                </div>
                <div className="amt">
                  {money(payment.amount)}
                  <small>THB</small>
                </div>
                {onEdit !== null && (
                  <button
                    className="pen"
                    type="button"
                    aria-label={`Edit payment ${money(payment.amount)} paid ${dayMonth(payment.paid_on)}`}
                    onClick={() => {
                      onEdit(payment);
                    }}
                  >
                    <Pen />
                  </button>
                )}
              </div>
              {payment.receipts.length > 0 && (
                <div className="rcs">
                  {payment.receipts.map((path) => {
                    const name = receiptName(path);
                    return (
                      <Receipt key={path} name={name} link={props.links.get(path) ?? null}>
                        <button
                          className="dl"
                          type="button"
                          aria-label={`Download ${name}`}
                          onClick={() => {
                            props.onDownload(path);
                          }}
                        >
                          <Download />
                        </button>
                      </Receipt>
                    );
                  })}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** CSS class and spoken name of each day kind. */
const KINDS: Record<DayKind, { className: string; name: string }> = {
  ot: { className: "d ot", name: "overtime" },
  leave: { className: "d lv", name: "leave" },
  holiday: { className: "d hol", name: "holiday" },
  weekend: { className: "d wkd", name: "weekend" },
  normal: { className: "d", name: "normal" },
};

/** What a calendar cell says under the date: OT hours, "leave" or "holiday". */
function cellText(kind: DayKind, day: Day | undefined, facts: PayFacts): string | null {
  if (kind === "ot" && day !== undefined) {
    return hoursShort(dayOt(day, facts.rates, facts.holidays).paidMinutes);
  }
  if (kind === "leave" || kind === "holiday") return kind;
  return null;
}

const daysByDate = (days: Day[]) => new Map(days.map((day) => [day.date, day]));

/** The pay period's days in Monday-first weeks, coloured by kind. */
export function Calendar(props: {
  period: Period;
  facts: PayFacts;
  today: string;
  onEditDay: OnEditDay;
}) {
  const { onEditDay } = props;
  const dates = datesIn(props.period);
  const days = daysByDate(props.facts.days);
  const blanksBeforeFirstDay = (weekdayOf(props.period.start) + 6) % 7;
  return (
    <div className="card">
      <div className="dow" aria-hidden="true">
        {["M", "T", "W", "T", "F", "S", "S"].map((letter, i) => (
          <span key={i}>{letter}</span>
        ))}
      </div>
      <ol className="cal" aria-label="Days">
        {Array.from({ length: blanksBeforeFirstDay }, (_, i) => (
          <li className="d e" key={`blank-${i.toString()}`} aria-hidden="true" />
        ))}
        {dates.map((date, i) => {
          const day = days.get(date);
          const kind = dayKind(date, props.facts.holidays, day);
          const { className, name } = KINDS[kind];
          const label = dayLabel(date);
          const text = cellText(kind, day, props.facts);
          return (
            <li
              key={date}
              className={date === props.today ? `${className} today` : className}
              aria-label={kind === "normal" ? label : `${label}, ${name}`}
            >
              {(i === 0 || dayOfMonth(date) === 1) && <span className="m">{monthName(date)}</span>}
              <span className="n">{dayOfMonth(date)}</span>
              {text !== null && <span className="t">{text}</span>}
              {onEditDay !== null && (
                <button
                  className="tap"
                  type="button"
                  aria-label={`Edit ${label}`}
                  onClick={() => {
                    onEditDay(date);
                  }}
                />
              )}
            </li>
          );
        })}
      </ol>
      <div className="legend">
        <span>
          <i style={{ background: "var(--day)", boxShadow: "inset 0 0 0 1px var(--line)" }} />
          Normal
        </span>
        <span>
          <i style={{ background: "var(--ot)" }} />
          Overtime
        </span>
        <span>
          <i style={{ background: "var(--lv)" }} />
          Leave
        </span>
        <span>
          <i style={{ background: "var(--hol)" }} />
          Holiday
        </span>
        <span>
          <i style={{ background: "var(--wkd)" }} />
          Weekend
        </span>
      </div>
      {onEditDay !== null && (
        <div className="hint">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="3" />
            <circle cx="12" cy="12" r="8" opacity=".5" />
          </svg>
          Tap any day to add overtime or leave
        </div>
      )}
    </div>
  );
}

export function Cross() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

/** A day's date as a chip: "WED / 30", coloured like its calendar cell. */
export function DateChip({ date, className }: { date: string; className: string }) {
  return (
    <div className={`chip ${className}`}>
      <small>{weekdayName(date)}</small>
      <b>{dayOfMonth(date)}</b>
    </div>
  );
}

type OnEditDay = ((date: string) => void) | null;

/** The admin's edit pen on a list row; nothing for the nanny. */
function EditDay({ date, onEditDay }: { date: string; onEditDay: OnEditDay }) {
  if (onEditDay === null) return null;
  return (
    <button
      className="pen"
      type="button"
      aria-label={`Edit ${dayLabel(date)}`}
      onClick={() => {
        onEditDay(date);
      }}
    >
      <Pen />
    </button>
  );
}

function OtItem({ day, facts, onEditDay }: { day: Day; facts: PayFacts; onEditDay: OnEditDay }) {
  const ot = dayOt(day, facts.rates, facts.holidays);
  const details = [
    otReason(day, facts.holidays),
    day.leave ? "Leave" : null,
    ot.countedMinutes === ot.paidMinutes
      ? null
      : `rounded up from ${hoursMinutes(ot.countedMinutes)}`,
    day.note,
  ].filter((detail) => detail !== null && detail !== "");
  return (
    <li className="item">
      <DateChip date={day.date} className="ot" />
      <div className="what">
        <b className="num">{day.ot.map((range) => range.replace("-", "–")).join(" · ")}</b>
        {details.length > 0 && <small>{details.join(" · ")}</small>}
      </div>
      <div className="amt">
        {money(ot.pay)}
        <small>{hours(ot.paidMinutes)}</small>
      </div>
      <EditDay date={day.date} onEditDay={onEditDay} />
    </li>
  );
}

function LeaveItem({ day, onEditDay }: { day: Day; onEditDay: OnEditDay }) {
  return (
    <li className="item">
      <DateChip date={day.date} className="lv" />
      <div className="what">
        <b>Leave</b>
        <small>{[day.note, "no deduction"].filter((detail) => detail !== null).join(" · ")}</small>
      </div>
      <div className="amt">
        0<small>no change</small>
      </div>
      <EditDay date={day.date} onEditDay={onEditDay} />
    </li>
  );
}

/** The pay period's OT and leave days, one per row, below the calendar. */
export function OtLeaveList(props: { period: Period; facts: PayFacts; onEditDay: OnEditDay }) {
  const { period, facts, onEditDay } = props;
  const days = daysIn(period, facts.days).filter((day) => day.ot.length > 0 || day.leave);
  const leaveDays = days.filter((day) => day.leave).length;
  const { otMinutes } = summarize(period, facts);
  return (
    <section className="list" aria-labelledby="ot-leave">
      <h3 id="ot-leave">
        Overtime &amp; leave
        {days.length > 0 && (
          <small>
            {hours(otMinutes)} · {leaveDays} leave {leaveDays === 1 ? "day" : "days"}
          </small>
        )}
      </h3>
      {days.length === 0 ? (
        <div className="empty">
          <b>No overtime or leave</b>Every day was a normal day.
        </div>
      ) : (
        <ul aria-label="Overtime & leave">
          {days.map((day) =>
            day.ot.length > 0 ? (
              <OtItem key={day.date} day={day} facts={facts} onEditDay={onEditDay} />
            ) : (
              <LeaveItem key={day.date} day={day} onEditDay={onEditDay} />
            ),
          )}
        </ul>
      )}
    </section>
  );
}

function Check() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Copy() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
      <rect x="8" y="8" width="12" height="12" rx="3" />
      <path
        d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Where a pay period's latest confirmation stands against its money numbers now. */
type ConfirmationState =
  { kind: "waiting" } | { kind: "confirmed" | "stale"; confirmation: Confirmation };

function confirmationState(confirmation: Confirmation | null, summary: Summary): ConfirmationState {
  if (confirmation === null) return { kind: "waiting" };
  return { kind: isStale(confirmation.snapshot, summary) ? "stale" : "confirmed", confirmation };
}

/** The admin's view of the nanny's latest confirmation: waiting, confirmed, or changed since. */
export function ConfirmationBadge(props: { confirmation: Confirmation | null; summary: Summary }) {
  const state = confirmationState(props.confirmation, props.summary);
  switch (state.kind) {
    case "waiting":
      return (
        <span className="state">
          <i />
          Waiting for Lola’s ✓
        </span>
      );
    case "confirmed":
      return (
        <span className="state ok">
          <i />
          Lola confirmed {confirmedOn(state.confirmation)}
        </span>
      );
    case "stale":
      return (
        <div className="flag" role="note" aria-label="Changed since Lola confirmed">
          <span className="ic" aria-hidden="true">
            !
          </span>
          <span>
            <b>Changed since Lola confirmed</b>
            <small>
              She checked {checked(state.confirmation.snapshot)} on{" "}
              {confirmedOn(state.confirmation)}. Now {checked(snapshotOf(props.summary))}.
            </small>
          </span>
        </div>
      );
    default: {
      const unreachable: never = state;
      return unreachable;
    }
  }
}

/** The nanny's "This looks right ✓", or that she confirmed the numbers as they are now. */
export function ConfirmButton(props: {
  confirmation: Confirmation | null;
  summary: Summary;
  saving: boolean;
  onConfirm: () => void;
}) {
  const state = confirmationState(props.confirmation, props.summary);
  if (state.kind === "confirmed") {
    return (
      <div className="done">
        <Check />
        You confirmed this on {confirmedOn(state.confirmation)}
      </div>
    );
  }
  return (
    <>
      <button className="btn pri" type="button" disabled={props.saving} onClick={props.onConfirm}>
        This looks right
        <Check />
      </button>
      {state.kind === "stale" && (
        <div className="note">
          You checked {checked(state.confirmation.snapshot)} on {confirmedOn(state.confirmation)}.
          The numbers changed since then.
        </div>
      )}
    </>
  );
}

/** What "Copy summary" puts on the clipboard, to paste into Messenger. */
export function summaryText(period: Period, summary: Summary, link: string): string {
  return [
    `Lola · ${periodName(period)} (${dayMonth(period.start)} – ${dayMonth(period.end)})`,
    `Salary ${money(summary.salary)}`,
    `OT ${hours(summary.otMinutes)} = ${money(summary.otPay)}`,
    `Total ${money(summary.total)} · Paid ${money(summary.paid)}`,
    `Balance ${money(summary.balance)} THB`,
    link,
  ].join("\n");
}
/** "Sep pay": the pay period a date falls in (the date itself before the start date). */
function periodNameOf(date: string): string {
  const period = periodOf(date);
  return period === null ? date : periodName(period);
}

/** "Sep pay (14 Sep 2026)" */
const fromLabel = (date: string) => `${periodNameOf(date)} (${dayMonth(date)} ${date.slice(0, 4)})`;

/** The pay periods a new rate can start from: the next twelve after today's. */
function upcomingPeriods(today: string): Period[] {
  const periods: Period[] = [];
  let period = currentPeriod(today);
  for (let i = 0; i < 12; i++) {
    period = nextPeriod(period);
    periods.push(period);
  }
  return periods;
}

/** Whole baht typed by the admin ("20,000"), or null if it isn't a positive whole number. */
function bahtOf(text: string): number | null {
  const amount = Number(text.replaceAll(",", "").trim());
  return Number.isInteger(amount) && amount > 0 ? amount : null;
}

/** A new salary and OT rate, starting from an upcoming pay period (never the current one). */
function NewRate(props: { current: Rate; today: string; onSave: (rate: Rate) => Promise<void> }) {
  const periods = upcomingPeriods(props.today);
  const [salary, setSalary] = useState(money(props.current.salary));
  const [otRate, setOtRate] = useState(money(props.current.ot_rate));
  const [from, setFrom] = useState(periods[0]?.start ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    const newSalary = bahtOf(salary);
    const newOtRate = bahtOf(otRate);
    if (newSalary === null || newOtRate === null) {
      setError("Salary and OT rate must be whole baht above 0.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await props.onSave({ effective_from: from, salary: newSalary, ot_rate: newOtRate });
    } catch {
      setError("Couldn’t save the new rate. Please try again.");
    }
    setBusy(false);
  }

  return (
    <form
      className="rateform"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <div className="two">
        <Field
          id="st-s"
          label="New salary"
          inputMode="numeric"
          autoComplete="off"
          value={salary}
          onChange={setSalary}
        />
        <Field
          id="st-o"
          label="New OT rate"
          inputMode="numeric"
          autoComplete="off"
          value={otRate}
          onChange={setOtRate}
        />
      </div>
      <div className="field">
        <label htmlFor="st-f">Starts from</label>
        <select
          className="inp"
          id="st-f"
          value={from}
          onChange={(event) => {
            setFrom(event.target.value);
          }}
        >
          {periods.map((period) => (
            <option key={period.start} value={period.start}>
              {periodTitle(period)}
            </option>
          ))}
        </select>
      </div>
      <ErrorAlert message={error} />
      <button className="btn sec" type="submit" disabled={busy}>
        Save new rate
      </button>
    </form>
  );
}

/** The rates in effect today, then every rate and agreed salary override. */
export function PayRates(props: {
  facts: PayFacts;
  today: string;
  onSave: (rate: Rate) => Promise<void>;
}) {
  const { facts, today } = props;
  const current = rateOn(today, facts.rates);
  const rates = facts.rates.toSorted((a, b) => a.effective_from.localeCompare(b.effective_from));
  return (
    <section className="sec" aria-labelledby="pay-rates">
      <h3 id="pay-rates">
        Pay rates<small>from {periodNameOf(current.effective_from)}</small>
      </h3>
      <div className="kv">
        <div>
          <small>Salary / month</small>
          <b>{money(current.salary)}</b>
        </div>
        <div>
          <small>OT / hour</small>
          <b>{money(current.ot_rate)}</b>
        </div>
      </div>
      <table className="hist">
        <thead>
          <tr>
            <th>From period</th>
            <th className="r">Salary</th>
            <th className="r">OT</th>
          </tr>
        </thead>
        <tbody>
          {rates.map((rate) => (
            <tr key={rate.effective_from}>
              <td>{fromLabel(rate.effective_from)}</td>
              <td className="r">{money(rate.salary)}</td>
              <td className="r">{money(rate.ot_rate)}</td>
            </tr>
          ))}
          {facts.overrides.map((override) => (
            <tr key={override.period_end}>
              <td className="muted">
                {periodNameOf(override.period_end)} fixed at {money(override.salary)}
                {override.note === null ? "" : ` (${override.note})`}
              </td>
              <td className="r">{money(override.salary)}</td>
              <td className="r">–</td>
            </tr>
          ))}
        </tbody>
      </table>
      <NewRate current={current} today={today} onSave={props.onSave} />
    </section>
  );
}

/** Holidays from today's pay period on, each removable, plus Add holiday. */
export function Holidays(props: {
  holidays: Holiday[];
  today: string;
  onAdd: (holiday: Holiday) => Promise<void>;
  onRemove: (date: string) => Promise<void>;
}) {
  const from = currentPeriod(props.today).start;
  const [adding, setAdding] = useState(false);
  const [date, setDate] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  /** Runs one change; shows `failed` and returns false if it fails. */
  async function change(action: () => Promise<void>, failed: string): Promise<boolean> {
    setError(null);
    try {
      await action();
      return true;
    } catch {
      setError(failed);
      return false;
    }
  }

  async function add() {
    if (date === "" || name.trim() === "") {
      setError("Pick a date and type the holiday’s name.");
      return;
    }
    const added = await change(
      () => props.onAdd({ date, name: name.trim() }),
      "Couldn’t add the holiday. Please try again.",
    );
    if (!added) return;
    setAdding(false);
    setDate("");
    setName("");
  }

  return (
    <section className="sec" aria-labelledby="holidays">
      <h3 id="holidays">
        Holidays<small>Thai public holidays</small>
      </h3>
      <ul className="hols" aria-label="Holidays">
        {props.holidays
          .filter((holiday) => holiday.date >= from)
          .map((holiday) => (
            <li className="item" key={holiday.date}>
              <DateChip date={holiday.date} className="hol" />
              <div className="what">
                <b>{holiday.name}</b>
                <small>{fullDate(holiday.date)}</small>
              </div>
              <button
                className="pen"
                type="button"
                aria-label={`Remove ${holiday.name}, ${fullDate(holiday.date)}`}
                onClick={() =>
                  void change(
                    () => props.onRemove(holiday.date),
                    `Couldn’t remove ${holiday.name}. Please try again.`,
                  )
                }
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </li>
          ))}
      </ul>
      <ErrorAlert message={error} />
      {adding ? (
        <form
          className="rateform"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void add();
          }}
        >
          <div className="two">
            <Field
              id="hd-d"
              label="Date"
              type="date"
              autoComplete="off"
              value={date}
              onChange={setDate}
            />
            <Field id="hd-n" label="Name" autoComplete="off" value={name} onChange={setName} />
          </div>
          <button className="btn sec" type="submit">
            Save holiday
          </button>
        </form>
      ) : (
        <button
          className="btn dash"
          type="button"
          onClick={() => {
            setAdding(true);
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Add holiday
        </button>
      )}
    </section>
  );
}

/** "Oct pay 2026": a pay period in a list that spans years. */
const periodNameWithYear = (period: Period) => `${periodName(period)} ${period.end.slice(0, 4)}`;

/** Saves the CSV as a file; the byte order mark makes Excel read Thai notes as UTF-8. */
function saveCsv(csv: string, fileName: string) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv" }));
  link.download = fileName;
  link.click();
  setTimeout(() => {
    URL.revokeObjectURL(link.href); // not at once: Safari may not have started the download
  }, 1000);
}

/** Pick a range of pay periods (default: all through today's) and download it as one CSV. */
export function ExportCsv({ facts, today }: { facts: PayFacts; today: string }) {
  const periods = periodsThrough(currentPeriod(today));
  const [from, setFrom] = useState(periods[0]?.end ?? "");
  const [to, setTo] = useState(periods.at(-1)?.end ?? "");
  const [error, setError] = useState<string | null>(null);

  function download() {
    const first = periods.find((period) => period.end === from);
    const last = periods.find((period) => period.end === to);
    if (first === undefined || last === undefined || from > to) {
      setError("Pick a From pay period on or before the To one.");
      return;
    }
    setError(null);
    saveCsv(exportCsv(first, last, facts), `lola-${first.start}-to-${last.end}.csv`);
  }

  const picker = (id: string, label: string, value: string, onChange: (end: string) => void) => (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select
        className="inp"
        id={id}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      >
        {periods.map((period) => (
          <option key={period.end} value={period.end}>
            {periodNameWithYear(period)}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <section className="sec" aria-labelledby="export-csv">
      <h3 id="export-csv">Export CSV</h3>
      <div className="two">
        {picker("csv-from", "From", from, setFrom)}
        {picker("csv-to", "To", to, setTo)}
      </div>
      <ErrorAlert message={error} />
      <button className="btn pri" type="button" onClick={download}>
        <Download />
        Download CSV
      </button>
      <div className="note">
        One file, one row per day: date, weekday, type, OT times, OT hours, OT pay, note, payment,
        receipt names.
      </div>
    </section>
  );
}
