import { useState } from "react";
import { signUp } from "../supabase";
import { Bear } from "../ui";

function problem(username: string, password: string, repeat: string): string | null {
  if (!/^[a-z0-9-]{3,20}$/.test(username))
    return "Username must be 3–20 characters: a–z, 0–9 and -";
  if (password.length < 10) return "Password must be at least 10 characters.";
  if (password !== repeat) return "The passwords don’t match.";
  return null;
}

export function SignUp() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    const found = problem(username, password, repeat);
    if (found !== null) {
      setError(found);
      return;
    }
    setBusy(true);
    const failed = await signUp(username, password);
    setBusy(false);
    setError(failed);
    if (failed === null) window.location.hash = "";
  }

  return (
    <div className="login">
      <Bear className="hero" />
      <h1 className="s">Create account</h1>
      <p>An admin approves new accounts before you can see anything.</p>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <div className="field">
          <label htmlFor="su-u">Username</label>
          <input
            className="inp"
            id="su-u"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
            }}
          />
          <span className="help">3–20 characters: a–z, 0–9 and -</span>
        </div>
        <div className="field">
          <label htmlFor="su-p">Password</label>
          <input
            className="inp"
            id="su-p"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
            }}
          />
          <span className="help">At least 10 characters. Save it in your password manager.</span>
        </div>
        <div className="field">
          <label htmlFor="su-c">Repeat password</label>
          <input
            className="inp"
            id="su-c"
            type="password"
            autoComplete="new-password"
            value={repeat}
            onChange={(event) => {
              setRepeat(event.target.value);
            }}
          />
        </div>
        {error !== null && (
          <p className="err" role="alert">
            {error}
          </p>
        )}
        <button className="btn pri" type="submit" disabled={busy}>
          Create account
        </button>
      </form>
      <div className="alt">
        Already have an account?{" "}
        <a className="link" href="#/">
          Log in
        </a>
      </div>
    </div>
  );
}
