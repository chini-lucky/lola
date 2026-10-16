import { useEffect, useState } from "react";
import { waitingPeople } from "../supabase";
import { BackBar, ErrorAlert } from "../ui";

const personIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <circle cx="12" cy="8.5" r="3.8" />
    <path d="M4.5 20c1.2-3.8 4-5.6 7.5-5.6s6.3 1.8 7.5 5.6" strokeLinecap="round" />
  </svg>
);

// Admin only: People, pay rates, holidays, Account.
export function Settings() {
  const [waiting, setWaiting] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    waitingPeople().then(
      (people) => {
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
      <a className="navrow" href="#/account">
        {personIcon}
        <span>Account</span>
        <i>›</i>
      </a>
    </div>
  );
}
