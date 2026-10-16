import type { Person } from "../supabase";
import { Bear, roleLabel } from "../ui";

// Placeholder until the pay period view (#5).
export function Home({ person }: { person: Person }) {
  return (
    <div className="screen">
      <div className="top">
        <Bear className="bearsm" />
        <div className="hi">
          <h1>
            <b>Hi {person.username} 👋</b>
          </h1>
          <small>{roleLabel(person.role)}</small>
        </div>
        <a className="iconbtn" href="#/account" aria-label="Account">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <circle cx="12" cy="8.5" r="3.8" />
            <path d="M4.5 20c1.2-3.8 4-5.6 7.5-5.6s6.3 1.8 7.5 5.6" strokeLinecap="round" />
          </svg>
        </a>
      </div>
      <div className="empty">
        <b>Your pay periods will show here.</b>
        Coming soon.
      </div>
      {person.role === "admin" && (
        <a className="navrow" href="#/people">
          <span>People</span>
          <i>›</i>
        </a>
      )}
    </div>
  );
}
