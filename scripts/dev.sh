#!/usr/bin/env bash
# Start this slot's local Supabase + Vite (run via scripts/slot.sh, i.e. npm run dev).
# Logs go to logs/ (gitignored) so agents can read them.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p logs
: "${LOLA_PROJECT_ID:?run via npm run dev (scripts/slot.sh sets the slot)}"

supabase start

for svc in db auth rest; do
  docker logs -f "supabase_${svc}_${LOLA_PROJECT_ID}" > "logs/supabase-${svc}.log" 2>&1 &
done
trap 'kill $(jobs -p) 2>/dev/null || true' EXIT

npx vite --port "$LOLA_DEV_PORT" --strictPort 2>&1 | tee logs/vite.log
