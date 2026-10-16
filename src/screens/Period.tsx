import { useEffect, useState } from "react";
import {
  currentPeriod,
  datesIn,
  dayKind,
  nextPeriod,
  payDayOf,
  prevPeriod,
  salaryOf,
  weekdayOf,
  type DayKind,
  type Period,
} from "../pay";
import { logOut, payFacts, type PayFacts, type Person } from "../supabase";
import { Bear, ErrorAlert } from "../ui";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const month = (date: string) => MONTHS[Number(date.slice(5, 7)) - 1] ?? "";
const day = (date: string) => Number(date.slice(8, 10));
const dayMonth = (date: string) => `${day(date).toString()} ${month(date)}`;
const money = (amount: number) => amount.toLocaleString("en-US");

/** "Oct pay · 28 Sep – 27 Oct" */
function periodTitle(period: Period): string {
  return `${month(period.end)} pay · ${dayMonth(period.start)} – ${dayMonth(period.end)}`;
}

function todayInBangkok(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
}

function kindClass(kind: DayKind): string {
  switch (kind) {
    case "holiday":
      return " hol";
    case "weekend":
      return " wkd";
    case "normal":
      return "";
    default: {
      const unreachable: never = kind;
      return unreachable;
    }
  }
}

function Header({ person }: { person: Person }) {
  if (person.role === "admin") {
    return (
      <div className="top">
        <div className="hi">
          <h1>
            <b>Lola’s pay</b>
          </h1>
          <small>Signed in as {person.username}</small>
        </div>
        <span className="pill">Admin</span>
      </div>
    );
  }
  return (
    <div className="top">
      <Bear className="bearsm" />
      <div className="hi">
        <h1>
          <b>Hi {person.username} 👋</b>
        </h1>
        <small>Pooh’s pay period so far</small>
      </div>
    </div>
  );
}

function Totals({ period, facts }: { period: Period; facts: PayFacts }) {
  const salary = salaryOf(period, facts.rates, facts.overrides);
  const agreed = facts.overrides.find((o) => o.period_end === period.end)?.note ?? null;
  return (
    <div className="totals">
      <Bear className="peek" />
      <div>
        <div className="lbl">{month(period.end)} pay total</div>
        <div className="big">
          {money(salary)}
          <small>THB</small>
        </div>
      </div>
      <dl className="rows">
        <dt>{agreed === null ? "Salary" : `Salary (${agreed})`}</dt>
        <dd>{money(salary)}</dd>
        <div className="sep" />
        <dt>Total</dt>
        <dd>{money(salary)}</dd>
      </dl>
    </div>
  );
}

function Calendar({
  period,
  holidays,
  today,
}: {
  period: Period;
  holidays: string[];
  today: string;
}) {
  const dates = datesIn(period);
  const lead = (weekdayOf(period.start) + 6) % 7; // weeks start on Monday
  return (
    <div className="card">
      <div className="dow" aria-hidden="true">
        {["M", "T", "W", "T", "F", "S", "S"].map((letter, i) => (
          <span key={i}>{letter}</span>
        ))}
      </div>
      <ol className="cal" aria-label="Days">
        {Array.from({ length: lead }, (_, i) => (
          <li className="d e" key={`lead-${i.toString()}`} aria-hidden="true" />
        ))}
        {dates.map((date, i) => {
          const kind = dayKind(date, holidays);
          const label = `${WEEKDAYS[weekdayOf(date)] ?? ""} ${dayMonth(date)}`;
          return (
            <li
              key={date}
              className={`d${kindClass(kind)}${date === today ? " today" : ""}`}
              aria-label={kind === "normal" ? label : `${label}, ${kind}`}
            >
              {(i === 0 || day(date) === 1) && <span className="m">{month(date)}</span>}
              <span className="n">{day(date)}</span>
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

/** The main screen for admin and nanny: one pay period at a time, ‹ › to move. */
export function PeriodView({ person }: { person: Person }) {
  const [today] = useState(todayInBangkok);
  const [period, setPeriod] = useState(() => currentPeriod(today));
  const [facts, setFacts] = useState<PayFacts | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    payFacts().then(setFacts, () => {
      setError("Couldn’t load the pay data. Check your connection and reload.");
    });
  }, []);

  const prev = prevPeriod(period);
  const payDay = payDayOf(period);
  const payDayYear = payDay.slice(0, 4) === today.slice(0, 4) ? "" : ` ${payDay.slice(0, 4)}`;

  return (
    <div className="screen">
      <Header person={person} />
      <section className="periodview" aria-label={periodTitle(period)}>
        <div className="period">
          <button
            type="button"
            aria-label="Previous pay period"
            disabled={prev === null}
            onClick={() => {
              if (prev !== null) setPeriod(prev);
            }}
          >
            ‹
          </button>
          <div>
            <b>{periodTitle(period)}</b>
            <small>
              Pay day {WEEKDAYS[weekdayOf(payDay)]} {dayMonth(payDay)}
              {payDayYear}
            </small>
          </div>
          <button
            type="button"
            aria-label="Next pay period"
            onClick={() => {
              setPeriod(nextPeriod(period));
            }}
          >
            ›
          </button>
        </div>
        <ErrorAlert message={error} />
        {facts !== null && (
          <>
            <Totals period={period} facts={facts} />
            <Calendar period={period} holidays={facts.holidays} today={today} />
          </>
        )}
      </section>
      {person.role === "admin" && (
        <a className="navrow" href="#/people">
          <span>People</span>
          <i>›</i>
        </a>
      )}
      <button className="link" type="button" onClick={() => void logOut()}>
        Log out
      </button>
    </div>
  );
}
