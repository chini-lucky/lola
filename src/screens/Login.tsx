import { useState } from "react";
import { logIn } from "../supabase";
import { Bear, ErrorAlert, Field } from "../ui";

export function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(await logIn(username, password));
    setBusy(false);
  }

  return (
    <div className="login">
      <Bear className="hero" />
      <h1>Lola</h1>
      <p>Pooh’s hours and pay, kept simple for Lola and the family.</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <Field
          id="li-u"
          label="Username"
          autoComplete="username"
          value={username}
          onChange={setUsername}
        />
        <Field
          id="li-p"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
        />
        <ErrorAlert message={error} />
        <button className="btn pri" type="submit" disabled={busy}>
          Log in
        </button>
      </form>
      <div className="alt">
        New here?{" "}
        <a className="link" href="#/signup">
          Create account
        </a>
      </div>
      <div className="grow" />
      <div className="a2hs">
        <span className="ic">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 3v12M7.5 7.5L12 3l4.5 4.5" />
            <path d="M6 11H5v9h14v-9h-1" />
          </svg>
        </span>
        <span>
          <b>Add Lola to your Home Screen.</b> In Safari tap Share, then “Add to Home Screen”.
          Otherwise iPhone may log you out after about 7 days.
        </span>
      </div>
    </div>
  );
}
