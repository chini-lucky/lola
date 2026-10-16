import { useState } from "react";
import { logIn } from "../supabase";
import { Bear } from "../ui";

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
        <div className="field">
          <label htmlFor="li-u">Username</label>
          <input
            className="inp"
            id="li-u"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
            }}
          />
        </div>
        <div className="field">
          <label htmlFor="li-p">Password</label>
          <input
            className="inp"
            id="li-p"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
            }}
          />
        </div>
        {error !== null && (
          <p className="err" role="alert">
            {error}
          </p>
        )}
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
    </div>
  );
}
