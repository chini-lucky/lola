// One-time: create the admin `chini-lucky` with a long random password.
// The password goes only to a file outside the repo (mode 600); it is never printed.
//
//   node scripts/create-admin.ts <project-ref>   production (needs `supabase login`)
//   node scripts/create-admin.ts local <file>    local stack, for trying the script
//
// The service role key is read from the Supabase CLI for this run only, never stored.
import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { unlinkSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { relative, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const username = "chini-lucky";
const repo = resolve(import.meta.dirname, "..");

function supabaseCli(args: string[]): string {
  return execFileSync("supabase", args, {
    cwd: repo,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });
}

// Reads a string field from CLI JSON output without trusting its shape.
function field(value: unknown, key: string): string {
  if (typeof value !== "object" || value === null || !(key in value)) return "";
  const found: unknown = Object.getOwnPropertyDescriptor(value, key)?.value;
  return typeof found === "string" ? found : "";
}

function target(ref: string): { url: string; serviceKey: string } {
  if (ref === "local") {
    const status: unknown = JSON.parse(supabaseCli(["status", "-o", "json"]));
    return { url: field(status, "API_URL"), serviceKey: field(status, "SERVICE_ROLE_KEY") };
  }
  const keys: unknown = JSON.parse(
    supabaseCli(["projects", "api-keys", "--project-ref", ref, "--reveal", "-o", "json"]),
  );
  const list: unknown[] = Array.isArray(keys) ? keys : [];
  const key = list.find((k) => field(k, "name") === "service_role");
  return { url: `https://${ref}.supabase.co`, serviceKey: field(key, "api_key") };
}

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

const [ref, fileArg] = process.argv.slice(2);
if (ref === undefined || (ref === "local" && fileArg === undefined))
  fail("Usage: node scripts/create-admin.ts <project-ref> | local <file>");
// local needs its own file, so a trial run never blocks the real one.
const file = resolve(fileArg ?? `${homedir()}/lola-admin-password.txt`);
if (!relative(repo, file).startsWith(".."))
  fail(`Refusing to write the password inside the repo: ${file}`);

const { url, serviceKey } = target(ref);
if (url === "" || serviceKey === "")
  fail("Could not get the API URL and service role key from the Supabase CLI.");
const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const password = randomBytes(24).toString("base64url"); // 32 characters
// "wx": never overwrite an earlier password file.
try {
  writeFileSync(file, `${password}\n`, { flag: "wx", mode: 0o600 });
} catch {
  fail(`${file} already exists (or cannot be written). Move it away first.`);
}

// Same hidden email as emailOf in src/supabase.ts.
const created = await admin.auth.admin
  .createUser({ email: `${username}@lola.invalid`, password, email_confirm: true })
  .catch((e: unknown) => ({ data: null, error: { message: String(e) } }));
if (created.error !== null) {
  unlinkSync(file);
  fail(`Could not create ${username}: ${created.error.message}`);
}

// The sign-up trigger made a waiting person; the service role may set the role directly.
const { id } = created.data.user;
const promoted = await admin.from("people").update({ role: "admin" }).eq("id", id).select("id");
if (promoted.error !== null || promoted.data.length !== 1) {
  await admin.auth.admin.deleteUser(id);
  unlinkSync(file);
  fail(`Could not make ${username} admin: ${promoted.error?.message ?? "no people row"}`);
}

process.stdout.write(`Created admin ${username}. Password saved to ${file} (mode 600).\n`);
