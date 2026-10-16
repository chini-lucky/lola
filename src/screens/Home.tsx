import { logOut, type Person, type Role } from "../supabase";
import { Bear } from "../ui";

function roleLabel(role: Role): string {
  switch (role) {
    case "admin":
      return "Admin";
    case "nanny":
      return "Nanny";
    case "waiting":
      return "Waiting";
    default: {
      const unreachable: never = role;
      return unreachable;
    }
  }
}

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
      <button className="link" type="button" onClick={() => void logOut()}>
        Log out
      </button>
    </div>
  );
}
