import { useCallback, useEffect, useState } from "react";
import {
  currentPeriod,
  nextPeriod,
  periodOf,
  rateOn,
  type PayFacts,
  type Period,
  type Rate,
} from "../pay";
import { payFacts, saveRate, waitingPeople } from "../supabase";
import {
  BackBar,
  dayMonth,
  ErrorAlert,
  Field,
  money,
  periodName,
  periodTitle,
  todayInBangkok,
} from "../ui";

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
function NewRate(props: { current: Rate; today: string; onSaved: () => void }) {
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
      await saveRate({ effective_from: from, salary: newSalary, ot_rate: newOtRate });
      props.onSaved();
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
function PayRates(props: { facts: PayFacts; today: string; onSaved: () => void }) {
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
      <NewRate current={current} today={today} onSaved={props.onSaved} />
    </section>
  );
}

// Admin only: People, pay rates, holidays, Account.
export function Settings() {
  const [today] = useState(todayInBangkok);
  const [facts, setFacts] = useState<PayFacts | null>(null);
  const [waiting, setWaiting] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
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

  useEffect(load, [load]);

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
      {facts !== null && <PayRates facts={facts} today={today} onSaved={load} />}
      <a className="navrow" href="#/account">
        {personIcon}
        <span>Account</span>
        <i>›</i>
      </a>
    </div>
  );
}
