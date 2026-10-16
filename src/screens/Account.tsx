import { useState } from "react";
import { changePassword, logOut, type Person } from "../supabase";
import { BackBar, ErrorAlert, Field, roleLabel } from "../ui";

function validationError(next: string, repeat: string): string | null {
  if (next.length < 10) return "Password must be at least 10 characters.";
  if (next !== repeat) return "The new passwords don’t match.";
  return null;
}

// Every approved person: change your own password, or log out.
export function Account({ person }: { person: Person }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [changed, setChanged] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setChanged(false);
    const invalid = validationError(next, repeat);
    if (invalid !== null) {
      setError(invalid);
      return;
    }
    setBusy(true);
    const changeError = await changePassword(person.username, current, next);
    setBusy(false);
    setError(changeError);
    if (changeError === null) {
      setChanged(true);
      setCurrent("");
      setNext("");
      setRepeat("");
    }
  }

  return (
    <div className="screen">
      <BackBar title="Account" />
      <div className="sec">
        <div className="item">
          <span className="av">{person.username.charAt(0)}</span>
          <div className="what">
            <b>{person.username}</b>
            <small>{roleLabel(person.role)} · logged in on this phone until you log out</small>
          </div>
        </div>
      </div>
      <form
        className="sec"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <h3>Change password</h3>
        <Field
          id="ac-o"
          label="Current password"
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={setCurrent}
        />
        <Field
          id="ac-n"
          label="New password"
          type="password"
          autoComplete="new-password"
          value={next}
          onChange={setNext}
          help="At least 10 characters"
        />
        <Field
          id="ac-c"
          label="Repeat new password"
          type="password"
          autoComplete="new-password"
          value={repeat}
          onChange={setRepeat}
        />
        <ErrorAlert message={error} />
        {changed && (
          <p className="ok" role="status">
            Password changed.
          </p>
        )}
        <button className="btn pri" type="submit" disabled={busy}>
          Change password
        </button>
      </form>
      <button
        className="btn bad"
        type="button"
        onClick={() => {
          window.location.hash = "#/";
          void logOut();
        }}
      >
        Log out
      </button>
      <div className="note">
        Forgot your password? Ask chini-lucky to remove your account, then sign up again.
      </div>
    </div>
  );
}
