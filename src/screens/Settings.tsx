import { useEffect, useState } from "react";
import { periodOf, rateOn, type PayFacts } from "../pay";
import { payFacts, waitingPeople } from "../supabase";
import { BackBar, dayMonth, ErrorAlert, money, periodName, todayInBangkok } from "../ui";

const personIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <circle cx="12" cy="8.5" r="3.8" />
    <path d="M4.5 20c1.2-3.8 4-5.6 7.5-5.6s6.3 1.8 7.5 5.6" strokeLinecap="round" />
  </svg>
);

/** "Sep pay": the pay period a date falls in (the date itself before the start date). */
function periodNameOf(date: string): string {
  const period = periodOf(date);
  return period === null ? date : periodName(period);
}

/** "Sep pay (14 Sep 2026)" */
const fromLabel = (date: string) => `${periodNameOf(date)} (${dayMonth(date)} ${date.slice(0, 4)})`;

/** The rates in effect today, then every rate and agreed salary override. */
function PayRates({ facts, today }: { facts: PayFacts; today: string }) {
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
    </section>
  );
}

// Admin only: People, pay rates, holidays, Account.
export function Settings() {
  const [today] = useState(todayInBangkok);
  const [facts, setFacts] = useState<PayFacts | null>(null);
  const [waiting, setWaiting] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([payFacts(), waitingPeople()]).then(
      ([loaded, people]) => {
        setFacts(loaded);
        setWaiting(people.length);
      },
      () => {
        setError("Couldn’t load the settings. Check your connection and reload.");
      },
    );
  }, []);

  return (
    <div className="screen">
      <BackBar title="Settings" />
      <ErrorAlert message={error} />
      <a className="navrow" href="#/people">
        {personIcon}
        <span>People</span>
        {waiting !== null && waiting > 0 && <b className="count">{waiting} waiting</b>}
        <i>›</i>
      </a>
      {facts !== null && <PayRates facts={facts} today={today} />}
      <a className="navrow" href="#/account">
        {personIcon}
        <span>Account</span>
        <i>›</i>
      </a>
    </div>
  );
}
