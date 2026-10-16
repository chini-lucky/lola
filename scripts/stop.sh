#!/usr/bin/env bash
# Stop a slot's local Supabase stack: this checkout's slot, or the slot given (npm run stop -- 2).
# Slots 1–4 also drop their Docker volumes (a worktree's DB is throwaway); slot 0 keeps its data.
set -euo pipefail
cd "$(dirname "$0")/.."
if (($# > 0)); then export LOLA_SLOT="$1"; fi
# shellcheck disable=SC2016 # expanded by the inner shell, after slot.sh has exported them.
exec scripts/slot.sh bash -c 'if ((LOLA_SLOT == 0)); then supabase stop; else supabase stop --no-backup; fi'
