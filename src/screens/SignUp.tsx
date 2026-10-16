import { useState } from "react";
import { signUp } from "../supabase";
import { Bear, ErrorAlert, Field } from "../ui";

function validationError(username: string, password: string, repeat: string): string | null {
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
    const invalid = validationError(username, password, repeat);
    if (invalid !== null) {
      setError(invalid);
      return;
    }
    setBusy(true);
    const signUpError = await signUp(username, password);
    setBusy(false);
    setError(signUpError);
    if (signUpError === null) window.location.hash = "";
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
        <Field
          id="su-u"
          label="Username"
          autoComplete="username"
          value={username}
          onChange={setUsername}
          help="3–20 characters: a–z, 0–9 and -"
        />
        <Field
          id="su-p"
          label="Password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          help="At least 10 characters. Save it in your password manager."
        />
        <Field
          id="su-c"
          label="Repeat password"
          type="password"
          autoComplete="new-password"
          value={repeat}
          onChange={setRepeat}
        />
        <ErrorAlert message={error} />
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
