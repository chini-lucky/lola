import {
  datesIn,
  dayKind,
  overrideOf,
  paymentsIn,
  totalsOf,
  weekdayOf,
  type DayKind,
  type Payment,
  type Period,
} from "./pay";
import type { PayFacts, Role } from "./supabase";

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
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "Oct" for any date in October. */
export const monthName = (date: string) => MONTHS[Number(date.slice(5, 7)) - 1] ?? "";
/** "Tue" for a Tuesday. */
export const weekdayName = (date: string) => WEEKDAYS[weekdayOf(date)] ?? "";
const dayOfMonth = (date: string) => Number(date.slice(8, 10));
/** "28 Sep" */
export const dayMonth = (date: string) => `${dayOfMonth(date).toString()} ${monthName(date)}`;
/** "Oct pay · 28 Sep – 27 Oct" */
export const periodTitle = (period: Period) =>
  `${monthName(period.end)} pay · ${dayMonth(period.start)} – ${dayMonth(period.end)}`;
/** Whole baht with thousands separators: "20,000". */
export const money = (amount: number) => amount.toLocaleString("en-US");

/** The pay period's totals card, with the bear peeking over it. */
export function Totals({ period, facts }: { period: Period; facts: PayFacts }) {
  const { salary, total, paid, balance } = totalsOf(period, facts);
  const agreed = overrideOf(period, facts.overrides)?.note ?? null;
  return (
    <div className="totals">
      <Bear className="peek" />
      <div>
        <div className="lbl">{monthName(period.end)} pay total</div>
        <div className="big">
          {money(total)}
          <small>THB</small>
        </div>
      </div>
      <dl className="rows">
        <dt>{agreed === null ? "Salary" : `Salary (${agreed})`}</dt>
        <dd>{money(salary)}</dd>
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

/** The pay period's payments by date paid, each with an edit pen for the admin. */
export function Payments(props: {
  period: Period;
  facts: PayFacts;
  onEdit: ((payment: Payment) => void) | null;
}) {
  const { period, facts, onEdit } = props;
  const payments = paymentsIn(period, facts.payments);
  const { paid } = totalsOf(period, facts);
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
            <li className="item" key={payment.id}>
              <div className="chip pay">
                <small>{weekdayName(payment.paid_on)}</small>
                <b>{dayOfMonth(payment.paid_on)}</b>
              </div>
              <div className="what">
                <b>{payment.note ?? "Payment"}</b>
                <small>Paid {dayMonth(payment.paid_on)}</small>
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** CSS class of a calendar day cell for its kind. */
function dayClass(kind: DayKind): string {
  switch (kind) {
    case "holiday":
      return "d hol";
    case "weekend":
      return "d wkd";
    case "normal":
      return "d";
    default: {
      const unreachable: never = kind;
      return unreachable;
    }
  }
}

/** The pay period's days in Monday-first weeks, coloured by kind. */
export function Calendar(props: { period: Period; holidays: string[]; today: string }) {
  const dates = datesIn(props.period);
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
          const kind = dayKind(date, props.holidays);
          const label = `${weekdayName(date)} ${dayMonth(date)}`;
          return (
            <li
              key={date}
              className={date === props.today ? `${dayClass(kind)} today` : dayClass(kind)}
              aria-label={kind === "normal" ? label : `${label}, ${kind}`}
            >
              {(i === 0 || dayOfMonth(date) === 1) && <span className="m">{monthName(date)}</span>}
              <span className="n">{dayOfMonth(date)}</span>
              {kind === "holiday" && <span className="t">holiday</span>}
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
