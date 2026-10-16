import { useEffect, useState } from "react";
import { approve, waitingPeople, type Person } from "../supabase";

const signedUpAt = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Bangkok",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

// Admin only. Reject, roles and Remove come with #12.
export function People() {
  const [waiting, setWaiting] = useState<Person[] | null>(null);

  useEffect(() => {
    void waitingPeople().then(setWaiting);
  }, []);

  async function approveOne(person: Person) {
    await approve(person.id);
    setWaiting(await waitingPeople());
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
      <div className="sec">
        <h3>
          Waiting for approval<small>{waiting?.length}</small>
        </h3>
        {waiting?.length === 0 && <div className="empty">Nobody is waiting.</div>}
        {waiting?.map((person) => (
          <div className="prow" key={person.id}>
            <div className="item">
              <span className="av">{person.username.charAt(0)}</span>
              <div className="what">
                <b>{person.username}</b>
                <small>Signed up {signedUpAt.format(new Date(person.created_at))}</small>
              </div>
            </div>
            <button
              className="btn pri sm"
              type="button"
              aria-label={`Approve ${person.username}`}
              onClick={() => void approveOne(person)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
                <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Approve
            </button>
          </div>
        ))}
        <div className="note">Approved people start as nanny.</div>
      </div>
    </div>
  );
}
