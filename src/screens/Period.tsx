import { useEffect, useState } from "react";
import { currentPeriod, nextPeriod, payDayOf, prevPeriod, type Period } from "../pay";
import { payFacts, type PayFacts, type Person } from "../supabase";
import { Bear, Calendar, dayMonth, ErrorAlert, monthName, Totals, weekdayName } from "../ui";

/** "Oct pay · 28 Sep – 27 Oct" */
function periodTitle(period: Period): string {
  return `${monthName(period.end)} pay · ${dayMonth(period.start)} – ${dayMonth(period.end)}`;
}

function todayInBangkok(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
}

const capitalised = (name: string) => name.charAt(0).toUpperCase() + name.slice(1);

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
      {person.role === "admin" ? (
        <div className="top">
          <div className="hi">
            <h1>
              <b>Lola’s pay</b>
            </h1>
            <small>Signed in as {person.username}</small>
          </div>
          <span className="pill">Admin</span>
        </div>
      ) : (
        <div className="top">
          <Bear className="bearsm" />
          <div className="hi">
            <h1>
              <b>Hi {capitalised(person.username)} 👋</b>
            </h1>
            <small>Pooh’s pay period so far</small>
          </div>
          <a className="iconbtn" href="#/account" aria-label="Account">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <circle cx="12" cy="8.5" r="3.8" />
              <path d="M4.5 20c1.2-3.8 4-5.6 7.5-5.6s6.3 1.8 7.5 5.6" strokeLinecap="round" />
            </svg>
          </a>
        </div>
      )}
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
              Pay day {weekdayName(payDay)} {dayMonth(payDay)}
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
        <>
          <a className="navrow" href="#/people">
            <span>People</span>
            <i>›</i>
          </a>
          <a className="navrow" href="#/account">
            <span>Account</span>
            <i>›</i>
          </a>
        </>
      )}
    </div>
  );
}
