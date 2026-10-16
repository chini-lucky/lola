#!/usr/bin/env bash
# Run a command against this checkout's slot: its own local Supabase stack and Vite ports, so
# parallel worktrees never share a DB or a dev server.
#   Slot 0 = the main clone: supabase/config.toml as is (ports 554xx, project id lola).
#   Slot N (1–4) = a linked worktree: project id lola-N, every Supabase port + N*100 (55421 -> 55521).
# A worktree claims the lowest free slot on first use and keeps it in .slot (gitignored).
# LOLA_SLOT=N overrides. Usage: scripts/slot.sh <command...>, or no command to print the slot.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
max_slot=4

# Taken = named in a worktree's .slot, or its stack still runs (worktree removed without a stop).
claimed_slots() {
  git -C "$root" worktree list --porcelain | sed -n 's/^worktree //p' | while read -r tree; do
    if [[ -f "$tree/.slot" ]]; then cat "$tree/.slot"; fi
  done
  docker ps --format '{{.Names}}' 2>/dev/null | sed -n 's/^supabase_db_lola-//p'
}

claim_slot() {
  local lock taken n
  lock="$(git -C "$root" rev-parse --path-format=absolute --git-common-dir)/lola-slot.lock"
  local tries=0
  until mkdir "$lock" 2>/dev/null; do
    # A claim takes well under a second; a lock older than ~10 s was left by a killed run.
    if ((++tries > 100)); then rmdir "$lock" 2>/dev/null || true; fi
    sleep 0.1
  done
  trap "rmdir '$lock'" EXIT
  taken="$(claimed_slots)"
  for ((n = 1; n <= max_slot; n++)); do
    if ! grep -qx "$n" <<<"$taken"; then
      echo "$n" >"$root/.slot"
      rmdir "$lock"
      trap - EXIT
      echo "slot.sh: claimed slot $n for $root" >&2
      return
    fi
  done
  echo "slot.sh: all slots 1–$max_slot are taken; run 'npm run stop' and remove finished worktrees" >&2
  exit 1
}

if [[ -z "${LOLA_SLOT:-}" && ! -f "$root/.slot" ]]; then
  if [[ "$(git -C "$root" rev-parse --absolute-git-dir)" -ef "$(git -C "$root" rev-parse --path-format=absolute --git-common-dir)" ]]; then
    LOLA_SLOT=0
  else
    claim_slot
  fi
fi
slot="${LOLA_SLOT:-$(cat "$root/.slot")}"
if ! [[ "$slot" =~ ^[0-$max_slot]$ ]]; then
  echo "slot.sh: slot must be 0–$max_slot, got '$slot'" >&2
  exit 1
fi

export LOLA_SLOT="$slot"
export LOLA_DEV_PORT=$((5173 + slot))
export LOLA_E2E_PORT=$((5273 + slot))
if ((slot == 0)); then
  export LOLA_PROJECT_ID=lola
else
  # Supabase CLI reads SUPABASE_<SECTION>_<KEY> over config.toml. Keep in step with its ports.
  base=$((55400 + slot * 100))
  export LOLA_PROJECT_ID="lola-$slot"
  export SUPABASE_PROJECT_ID="$LOLA_PROJECT_ID"
  export SUPABASE_API_PORT=$((base + 21))
  export SUPABASE_DB_PORT=$((base + 22))
  export SUPABASE_DB_SHADOW_PORT=$((base + 20))
  export SUPABASE_DB_POOLER_PORT=$((base + 29))
  export SUPABASE_STUDIO_PORT=$((base + 23))
  export SUPABASE_LOCAL_SMTP_PORT=$((base + 24))
  export SUPABASE_ANALYTICS_PORT=$((base + 27))
  export SUPABASE_EDGE_RUNTIME_INSPECTOR_PORT=$((8083 + slot))
  export SUPABASE_AUTH_SITE_URL="http://127.0.0.1:$LOLA_DEV_PORT"
  # Beats .env.development (Vite never overrides variables already in the environment). The anon
  # key there stays valid: every local stack signs with the same default JWT secret.
  export VITE_SUPABASE_URL="http://127.0.0.1:$SUPABASE_API_PORT"
fi

if (($# == 0)); then
  echo "slot $LOLA_SLOT: project $LOLA_PROJECT_ID, API ${VITE_SUPABASE_URL:-http://127.0.0.1:55421}," \
    "dev http://localhost:$LOLA_DEV_PORT/lola/, e2e port $LOLA_E2E_PORT"
  exit 0
fi
exec "$@"
