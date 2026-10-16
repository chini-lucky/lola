import { useCallback, useEffect, useState } from "react";
import { PaymentSheet } from "./PaymentSheet";
import { currentPeriod, nextPeriod, payDayOf, prevPeriod, type Period } from "../pay";
import { logOut, payFacts, type PayFacts, type Person } from "../supabase";
import {
  Bear,
  Calendar,
  dayMonth,
  ErrorAlert,
  monthName,
  Payments,
  Plus,
  Totals,
  weekdayName,
} from "../ui";

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
  const [adding, setAdding] = useState(false);

  const load = useCallback(() => {
    payFacts().then(setFacts, () => {
      setError("Couldn’t load the pay data. Check your connection and reload.");
    });
  }, []);
  useEffect(load, [load]);

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
            {person.role === "admin" && (
              <button
                className="btn pri"
                type="button"
                onClick={() => {
                  setAdding(true);
                }}
              >
                <Plus />
                Add payment
              </button>
            )}
            <Calendar period={period} holidays={facts.holidays} today={today} />
            <Payments period={period} facts={facts} />
          </>
        )}
      </section>
      {adding && facts !== null && (
        <PaymentSheet
          today={today}
          facts={facts}
          onClose={() => {
            setAdding(false);
          }}
          onSaved={() => {
            setAdding(false);
            load();
          }}
        />
      )}
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
