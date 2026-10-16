import { logOut, type Person } from "../supabase";
import { Bear } from "../ui";

export function Waiting({ person, onCheckAgain }: { person: Person; onCheckAgain: () => void }) {
  return (
    <div className="login">
      <Bear className="hero lg" />
      <h1 className="s">Almost there, {person.username}</h1>
      <p>Your account is waiting for approval. Ask chini-lucky to approve it, then check again.</p>
      <span className="state">
        <i />
        Waiting for approval
      </span>
      <div className="grow" />
      <button className="btn pri" type="button" onClick={onCheckAgain}>
        Check again
      </button>
      <button className="link" type="button" onClick={() => void logOut()}>
        Log out
      </button>
    </div>
  );
}
