import { useCallback, useEffect, useState } from "react";
import { approve, removePerson, waitingPeople, type Person } from "../supabase";
import { ErrorAlert } from "../ui";

const signedUpAt = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Bangkok",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

// Admin only.
export function People() {
  const [waiting, setWaiting] = useState<Person[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    void waitingPeople().then(setWaiting, () => {
      setError("Couldn’t load people. Check your connection and try again.");
    });
  }, []);

  useEffect(load, [load]);

  /** Runs one change, then reloads the lists; shows `failed` if the change fails. */
  async function change(action: () => Promise<void>, failed: string) {
    setError(null);
    try {
      await action();
    } catch {
      setError(failed);
    }
    load();
  }

  return (
    <div className="screen">
      <div className="bar">
        <a className="iconbtn" href="#/" aria-label="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
            <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
        <b>People</b>
      </div>
      <ErrorAlert message={error} />
      <div className="sec">
        <h3>
          Waiting for approval<small>{waiting?.length}</small>
        </h3>
        {waiting?.length === 0 && <div className="empty">Nobody is waiting.</div>}
        {waiting?.map((person) => (
          <div className="prow" key={person.id}>
            <div className="item">
              <span className="av w">{person.username.charAt(0)}</span>
              <div className="what">
                <b>{person.username}</b>
                <small>Signed up {signedUpAt.format(new Date(person.created_at))}</small>
              </div>
            </div>
            <div className="duo">
              <button
                className="btn bad sm"
                type="button"
                aria-label={`Reject ${person.username}`}
                onClick={() =>
                  void change(
                    () => removePerson(person.id),
                    `Couldn’t reject ${person.username}. Please try again.`,
                  )
                }
              >
                Reject
              </button>
              <button
                className="btn pri sm"
                type="button"
                aria-label={`Approve ${person.username}`}
                onClick={() =>
                  void change(
                    () => approve(person.id),
                    `Couldn’t approve ${person.username}. Please try again.`,
                  )
                }
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
                  <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Approve
              </button>
            </div>
          </div>
        ))}
        <div className="note">Approved people start as nanny. Reject deletes the sign-up.</div>
      </div>
    </div>
  );
}
