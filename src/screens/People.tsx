import { useCallback, useEffect, useState } from "react";
import { approvedPeople, removePerson, setRole, waitingPeople, type Person } from "../supabase";
import { ErrorAlert, roleLabel } from "../ui";

const signedUpAt = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Bangkok",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const approvedRoles: readonly ("nanny" | "admin")[] = ["nanny", "admin"];

interface Lists {
  waiting: Person[];
  approved: Person[];
}

async function fetchLists(): Promise<Lists> {
  const [waiting, approved] = await Promise.all([waitingPeople(), approvedPeople()]);
  return { waiting, approved };
}

// Admin only.
export function People() {
  const [lists, setLists] = useState<Lists | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    void fetchLists().then(setLists, () => {
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
          Waiting for approval<small>{lists?.waiting.length}</small>
        </h3>
        {lists?.waiting.length === 0 && <div className="empty">Nobody is waiting.</div>}
        {lists?.waiting.map((person) => (
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
                    () => setRole(person.id, "nanny"),
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
      <div className="sec">
        <h3>
          Approved<small>{lists?.approved.length}</small>
        </h3>
        {lists?.approved.map((person) => (
          <div className="prow" key={person.id}>
            <div className="item">
              <span className="av">{person.username.charAt(0)}</span>
              <div className="what">
                <b>{person.username}</b>
                <small>Signed up {signedUpAt.format(new Date(person.created_at))}</small>
              </div>
            </div>
            <div className="acts">
              <div className="seg" role="group" aria-label={`Role for ${person.username}`}>
                {approvedRoles.map((role) => (
                  <button
                    key={role}
                    type="button"
                    aria-pressed={person.role === role}
                    onClick={() =>
                      void change(
                        () => setRole(person.id, role),
                        `Couldn’t change the role of ${person.username}. Please try again.`,
                      )
                    }
                  >
                    {roleLabel(role)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
        <div className="note">
          Forgotten password: remove the account, they sign up again, you approve.
        </div>
      </div>
    </div>
  );
}
