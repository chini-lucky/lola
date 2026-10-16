import { createClient, type AuthError } from "@supabase/supabase-js";
import type { Database } from "./db.types";
import type { Payment, PeriodOverride, Rate } from "./pay";

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

const personColumns = "id, username, role, created_at";

function toPerson(row: { id: string; username: string; role: string; created_at: string }): Person {
  return { ...row, role: row.role as Role }; // people.role is checked in the DB
}

/** The signed-in person's own row, or null if it is gone (account removed). */
export async function myPerson(id: string): Promise<Person | null> {
  const { data, error } = await supabase
    .from("people")
    .select(personColumns)
    .eq("id", id)
    .maybeSingle();
  if (error !== null) throw error;
  return data === null ? null : toPerson(data);
}

/** Admin only (RLS): sign-ups waiting for approval, oldest first. */
export async function waitingPeople(): Promise<Person[]> {
  const { data, error } = await supabase
    .from("people")
    .select(personColumns)
    .eq("role", "waiting")
    .order("created_at");
  if (error !== null) throw error;
  return data.map(toPerson);
}

/** Admin only: approving makes a waiting person a nanny. */
export async function approve(id: string): Promise<void> {
  const { error } = await supabase.rpc("set_role", { target: id, new_role: "nanny" });
  if (error !== null) throw error;
}

/** The facts the pay maths needs: rates, agreed overrides, holiday dates, payments. */
export interface PayFacts {
  rates: Rate[];
  overrides: PeriodOverride[];
  holidays: string[];
  payments: Payment[];
}

export async function payFacts(): Promise<PayFacts> {
  const [rates, overrides, holidays, payments] = await Promise.all([
    supabase.from("rates").select("effective_from, salary, ot_rate"),
    supabase.from("period_overrides").select("period_end, salary, note"),
    supabase.from("holidays").select("date"),
    supabase.from("payments").select("id, period_end, paid_on, amount, note"),
  ]);
  if (rates.error !== null) throw rates.error;
  if (overrides.error !== null) throw overrides.error;
  if (holidays.error !== null) throw holidays.error;
  if (payments.error !== null) throw payments.error;
  return {
    rates: rates.data,
    overrides: overrides.data,
    holidays: holidays.data.map((holiday) => holiday.date),
    payments: payments.data,
  };
}

/** A payment as the admin enters it; the DB gives it its id. */
export type PaymentFields = Omit<Payment, "id">;

/** Admin only (RLS). */
export async function addPayment(fields: PaymentFields): Promise<void> {
  const { error } = await supabase.from("payments").insert(fields);
  if (error !== null) throw error;
}
