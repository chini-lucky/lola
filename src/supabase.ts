import { createClient, type AuthError } from "@supabase/supabase-js";
import type { Database } from "./db.types";
import type { PayFacts, Payment, Rate } from "./pay";
import { receiptType } from "./receipts";

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  // Stay logged in until Log out: the session lives in localStorage and refreshes itself.
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } },
);

export type Role = "admin" | "nanny" | "waiting";
export type ApprovedRole = Exclude<Role, "waiting">;

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
  same_password: "The new password must be different from the current one.",
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

/** Checks the current password, then sets the new one. Returns an error message, or null. */
export async function changePassword(
  username: string,
  current: string,
  next: string,
): Promise<string | null> {
  const check = await supabase.auth.signInWithPassword({
    email: emailOf(username),
    password: current,
  });
  if (check.error !== null)
    return check.error.code === "invalid_credentials"
      ? "Current password is wrong."
      : authMessage(check.error);
  const { error } = await supabase.auth.updateUser({ password: next });
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

/** Admin only (RLS): approved people (admins and nannies), oldest first. */
export async function approvedPeople(): Promise<Person[]> {
  const { data, error } = await supabase
    .from("people")
    .select(personColumns)
    .neq("role", "waiting")
    .order("created_at");
  if (error !== null) throw error;
  return data.map(toPerson);
}

/** Admin only, never on yourself (set_role guards both). Approve = setRole(id, "nanny"). */
export async function setRole(id: string, role: ApprovedRole): Promise<void> {
  const { error } = await supabase.rpc("set_role", { target: id, new_role: role });
  if (error !== null) throw error;
}

/** Admin only: Reject a waiting sign-up or Remove an approved person (deletes the account). */
export async function removePerson(id: string): Promise<void> {
  const result = await supabase.functions.invoke("remove-user", { body: { userId: id } });
  if (result.error !== null) throw result.error as Error; // typed any by supabase-js
}

export async function payFacts(): Promise<PayFacts> {
  const [rates, overrides, holidays, days, payments] = await Promise.all([
    supabase.from("rates").select("effective_from, salary, ot_rate"),
    supabase.from("period_overrides").select("period_end, salary, note"),
    supabase.from("holidays").select("date"),
    supabase.from("days").select("date, ot, leave, note").order("date"),
    supabase.from("payments").select("id, period_end, paid_on, amount, note, receipts"),
  ]);
  if (rates.error !== null) throw rates.error;
  if (overrides.error !== null) throw overrides.error;
  if (holidays.error !== null) throw holidays.error;
  if (days.error !== null) throw days.error;
  if (payments.error !== null) throw payments.error;
  return {
    rates: rates.data,
    overrides: overrides.data,
    holidays: holidays.data.map((holiday) => holiday.date),
    days: days.data,
    payments: payments.data,
  };
}

/** Admin only (RLS). The id is made in the browser, so receipts can be stored under it first. */
export async function addPayment(payment: Payment): Promise<void> {
  const { error } = await supabase.from("payments").insert(payment);
  if (error !== null) throw error;
}

/** Admin only (RLS). */
export async function editPayment({ id, ...fields }: Payment): Promise<void> {
  const { error } = await supabase.from("payments").update(fields).eq("id", id);
  if (error !== null) throw error;
}

/** Admin only (RLS): deletes the payment, then its receipt files. */
export async function deletePayment(payment: Payment): Promise<void> {
  const { error } = await supabase.from("payments").delete().eq("id", payment.id);
  if (error !== null) throw error;
  // The payment is gone, so a file left behind by a failed remove is harmless.
  await removeReceipts(payment.receipts).catch(() => undefined);
}

const receipts = () => supabase.storage.from("receipts");

/** Admin only (storage policy). Stores a receipt file at the given path. */
export async function uploadReceipt(path: string, file: File): Promise<void> {
  const contentType = receiptType(file);
  const { error } = await receipts().upload(path, file, { contentType, upsert: false });
  if (error !== null) throw error;
}

/** Admin only (storage policy). Without the right, Storage removes nothing and says nothing. */
export async function removeReceipts(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const { data, error } = await receipts().remove(paths);
  if (error !== null) throw error;
  if (data.length !== paths.length) throw new Error("Some receipts were not removed");
}

/** Short-lived links to view receipts, by path (admin and nanny). */
export async function receiptLinks(paths: string[]): Promise<Map<string, string>> {
  if (paths.length === 0) return new Map();
  const { data, error } = await receipts().createSignedUrls(paths, 60 * 60);
  if (error !== null) throw error;
  return new Map(
    data.flatMap(({ path, signedUrl }) =>
      path === null || signedUrl === null ? [] : [[path, signedUrl]],
    ),
  );
}

/** A one-minute link that downloads the receipt as the given file name. */
export async function receiptDownloadLink(path: string, name: string): Promise<string> {
  const { data, error } = await receipts().createSignedUrl(path, 60, { download: name });
  if (error !== null) throw error;
  return data.signedUrl;
}

/** Admin only (RLS): adds a rate, or replaces the one starting on the same date. */
export async function saveRate(rate: Rate): Promise<void> {
  const { error } = await supabase.from("rates").upsert(rate);
  if (error !== null) throw error;
}

export interface Holiday {
  date: string;
  name: string;
}

/** Every holiday, by date. */
export async function holidays(): Promise<Holiday[]> {
  const { data, error } = await supabase.from("holidays").select("date, name").order("date");
  if (error !== null) throw error;
  return data;
}

/** Admin only (RLS): adds a holiday, or renames the one on the same date. */
export async function saveHoliday(holiday: Holiday): Promise<void> {
  const { error } = await supabase.from("holidays").upsert(holiday);
  if (error !== null) throw error;
}

/** Admin only (RLS). */
export async function removeHoliday(date: string): Promise<void> {
  const { error } = await supabase.from("holidays").delete().eq("date", date);
  if (error !== null) throw error;
}
