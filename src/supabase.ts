import { createClient, type AuthError } from "@supabase/supabase-js";
import type { Database } from "./db.types";

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  // Stay logged in until Log out: the session lives in localStorage and refreshes itself.
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } },
);

export type Role = "admin" | "nanny" | "waiting";

export interface Person {
  id: string;
  username: string;
  role: Role;
  created_at: string;
}

// Usernames map to a hidden email that can never receive mail (.invalid is reserved).
const emailOf = (username: string) => `${username}@lola.invalid`;

const authMessages: Partial<Record<string, string>> = {
  weak_password: "Password must be at least 10 characters.",
  user_already_exists: "That username is taken. Pick another one.",
  invalid_credentials: "Wrong username or password.",
};

function authMessage(error: AuthError): string {
  return authMessages[error.code ?? ""] ?? "Something went wrong. Please try again.";
}

/** Returns an error message, or null when logged in. */
export async function logIn(username: string, password: string): Promise<string | null> {
  const { error } = await supabase.auth.signInWithPassword({ email: emailOf(username), password });
  return error === null ? null : authMessage(error);
}

/** Returns an error message, or null when signed up (and logged in as waiting). */
export async function signUp(username: string, password: string): Promise<string | null> {
  const { error } = await supabase.auth.signUp({ email: emailOf(username), password });
  return error === null ? null : authMessage(error);
}

export async function logOut(): Promise<void> {
  await supabase.auth.signOut();
}
