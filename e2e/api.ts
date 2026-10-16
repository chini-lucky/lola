import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { loadEnv } from "vite";
import { admin } from "./logins";

// The same Supabase the app under test talks to (this slot's URL beats .env.development).
const env = loadEnv("development", process.cwd());
const url = env.VITE_SUPABASE_URL ?? "";
const anonKey = env.VITE_SUPABASE_ANON_KEY ?? "";

// Same mapping as emailOf in src/supabase.ts (which can't load outside Vite).
const emailOf = (username: string) => `${username}@lola.invalid`;
const newClient = () => createClient(url, anonKey, { auth: { persistSession: false } });

/** A fresh username nobody has used yet. */
export function newUsername(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}`;
}

/** A supabase-js client logged in as the given user (no browser). */
export async function loggedIn(username: string, password: string): Promise<SupabaseClient> {
  const client = newClient();
  const { error } = await client.auth.signInWithPassword({ email: emailOf(username), password });
  if (error !== null) throw error;
  return client;
}

/** Signs up a new person, who waits for approval. Returns their id. */
export async function signUpWaiting(username: string, password: string): Promise<string> {
  const { data, error } = await newClient().auth.signUp({ email: emailOf(username), password });
  if (error !== null) throw error;
  if (data.user === null) throw new Error("sign-up returned no user");
  return data.user.id;
}

/** Calls the remove-user Edge Function as the given user and returns its HTTP status. */
export async function removeUserStatus(
  caller: { username: string; password: string },
  userId: string,
): Promise<number> {
  const client = await loggedIn(caller.username, caller.password);
  const { data } = await client.auth.getSession();
  const response = await fetch(`${url}/functions/v1/remove-user`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${data.session?.access_token ?? ""}`,
      apikey: anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId }),
  });
  return response.status;
}

/** Signs up a new person and has the admin approve them as a nanny. Returns their id. */
export async function signUpNanny(username: string, password: string): Promise<string> {
  const id = await signUpWaiting(username, password);
  const asAdmin = await loggedIn(admin.username, admin.password);
  const { error } = await asAdmin.rpc("set_role", { target: id, new_role: "nanny" });
  if (error !== null) throw error;
  return id;
}

/** Deletes the rate starting on a date, as the admin (undoes a test's rate change). */
export async function deleteRate(effectiveFrom: string): Promise<void> {
  const asAdmin = await loggedIn(admin.username, admin.password);
  const { error } = await asAdmin.from("rates").delete().eq("effective_from", effectiveFrom);
  if (error !== null) throw error;
}
