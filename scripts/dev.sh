#!/usr/bin/env bash
# Start local Supabase + Vite. Logs go to logs/ (gitignored) so agents can read them.
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p logs

supabase start

# Container names come from project_id = "lola" in supabase/config.toml.
for svc in db auth rest; do
  docker logs -f "supabase_${svc}_lola" > "logs/supabase-${svc}.log" 2>&1 &
done
trap 'kill $(jobs -p) 2>/dev/null || true' EXIT

npx vite --port 5173 --strictPort 2>&1 | tee logs/vite.log
