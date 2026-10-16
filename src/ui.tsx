import {
  datesIn,
  dayKind,
  dayOt,
  daysIn,
  otReason,
  overrideOf,
  summarize,
  weekdayOf,
  type Day,
  type DayKind,
  type PayFacts,
  type Period,
} from "./pay";
import type { Role } from "./supabase";

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
  type?: "text" | "password";
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
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "Oct" for any date in October. */
export const monthName = (date: string) => MONTHS[Number(date.slice(5, 7)) - 1] ?? "";
/** "Tue" for a Tuesday. */
export const weekdayName = (date: string) => WEEKDAYS[weekdayOf(date)] ?? "";
const dayOfMonth = (date: string) => Number(date.slice(8, 10));
/** "28 Sep" */
export const dayMonth = (date: string) => `${dayOfMonth(date).toString()} ${monthName(date)}`;
/** "Oct pay" */
export const periodName = (period: Period) => `${monthName(period.end)} pay`;
/** "Oct pay · 28 Sep – 27 Oct" */
export const periodTitle = (period: Period) =>
  `${periodName(period)} · ${dayMonth(period.start)} – ${dayMonth(period.end)}`;
/** Today's date in Bangkok. */
export const todayInBangkok = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
/** Whole baht with thousands separators: "20,000". */
export const money = (amount: number) => amount.toLocaleString("en-US");
/** OT minutes as hours: "2.5 h". */
const hours = (minutes: number) => `${(minutes / 60).toString()} h`;
/** OT minutes as hours in a calendar cell: "2.5h". */
const hoursShort = (minutes: number) => `${(minutes / 60).toString()}h`;
/** Minutes as "1h 10m". */
function hoursMinutes(minutes: number): string {
  const rest = minutes % 60;
  return `${Math.floor(minutes / 60).toString()}h${rest === 0 ? "" : ` ${rest.toString()}m`}`;
}

/** The pay period's totals card, with the bear peeking over it. */
export function Totals({ period, facts }: { period: Period; facts: PayFacts }) {
  const { salary, otMinutes, otPay, total } = summarize(period, facts);
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
      </dl>
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
export function Calendar(props: { period: Period; facts: PayFacts; today: string }) {
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
          const label = `${weekdayName(date)} ${dayMonth(date)}`;
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
    </div>
  );
}

/** A day's date as a chip: "WED / 30", coloured like its calendar cell. */
function DateChip({ date, className }: { date: string; className: string }) {
  return (
    <div className={`chip ${className}`}>
      <small>{weekdayName(date)}</small>
      <b>{dayOfMonth(date)}</b>
    </div>
  );
}

function OtItem({ day, facts }: { day: Day; facts: PayFacts }) {
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
    </li>
  );
}

function LeaveItem({ day }: { day: Day }) {
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
    </li>
  );
}

/** The pay period's OT and leave days, one per row, below the calendar. */
export function OtLeaveList({ period, facts }: { period: Period; facts: PayFacts }) {
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
              <OtItem key={day.date} day={day} facts={facts} />
            ) : (
              <LeaveItem key={day.date} day={day} />
            ),
          )}
        </ul>
      )}
    </section>
  );
}
