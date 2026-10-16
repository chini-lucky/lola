// Reject (a waiting sign-up) or Remove (an approved person): deletes the auth user, so it needs
// the service role. Only an admin may call it, and never on themselves.
import { createClient } from "npm:@supabase/supabase-js@2.118.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function env(name: string): string {
  const value = Deno.env.get(name);
  if (value === undefined) throw new Error(`${name} is not set`);
  return value;
}

const noSession = { auth: { persistSession: false, autoRefreshToken: false } };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { error: "use POST" });

  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer /, "");
  const asCaller = createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), {
    ...noSession,
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: role, error: roleError } = await asCaller.rpc("my_role");
  if (roleError !== null) return json(500, { error: roleError.message });
  if (role !== "admin") return json(403, { error: "only an admin can remove people" });

  const { data: caller, error: callerError } = await asCaller.auth.getUser(token);
  if (callerError !== null) return json(401, { error: callerError.message });
  const { userId } = (await req.json()) as { userId?: unknown };
  if (typeof userId !== "string") return json(400, { error: "userId is required" });
  if (userId === caller.user.id) return json(400, { error: "you cannot remove yourself" });

  const asService = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), noSession);
  const { data: removed, error: readError } = await asService
    .from("people")
    .select()
    .eq("id", userId)
    .maybeSingle();
  if (readError !== null) return json(500, { error: readError.message });
  if (removed === null) return json(404, { error: "no such person" });
  const { error: deleteError } = await asService.auth.admin.deleteUser(userId); // people row cascades
  if (deleteError !== null) return json(500, { error: deleteError.message });
  // The audit trigger skips people deletes (it would not know the admin): log who removed whom.
  const { error: auditError } = await asService
    .from("audit_log")
    .insert({ actor: caller.user.id, tbl: "people", op: "delete", old: removed });
  if (auditError !== null) return json(500, { error: auditError.message });
  return json(200, { ok: true });
});
