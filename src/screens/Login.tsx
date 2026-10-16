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
    </div>
  );
}
