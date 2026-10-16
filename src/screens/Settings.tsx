import { useCallback, useEffect, useState } from "react";
import type { PayFacts } from "../pay";
import {
  holidays,
  payFacts,
  removeHoliday,
  saveHoliday,
  saveRate,
  waitingPeople,
  type Holiday,
} from "../supabase";
import { BackBar, ErrorAlert, ExportCsv, Holidays, PayRates, todayInBangkok } from "../ui";

const personIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <circle cx="12" cy="8.5" r="3.8" />
    <path d="M4.5 20c1.2-3.8 4-5.6 7.5-5.6s6.3 1.8 7.5 5.6" strokeLinecap="round" />
  </svg>
);

// Admin only: People, pay rates, holidays, CSV export, Account.
export function Settings() {
  const [today] = useState(todayInBangkok);
  const [facts, setFacts] = useState<PayFacts | null>(null);
  const [holidayList, setHolidayList] = useState<Holiday[]>([]);
  const [waiting, setWaiting] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    Promise.all([payFacts(), holidays(), waitingPeople()]).then(
      ([loaded, holidayRows, people]) => {
        setFacts(loaded);
        setHolidayList(holidayRows);
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
      {facts !== null && (
        <>
          <PayRates
            facts={facts}
            today={today}
            onSave={async (rate) => {
              await saveRate(rate);
              load();
            }}
          />
          <Holidays
            holidays={holidayList}
            today={today}
            onAdd={async (holiday) => {
              await saveHoliday(holiday);
              load();
            }}
            onRemove={async (date) => {
              await removeHoliday(date);
              load();
            }}
          />
          <ExportCsv facts={facts} today={today} />
        </>
      )}
      <a className="navrow" href="#/account">
        {personIcon}
        <span>Account</span>
        <i>›</i>
      </a>
    </div>
  );
}
