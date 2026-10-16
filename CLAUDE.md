# Lola — agent guide

Nanny hours and pay app: an admin records exceptions (OT, leave), payments and receipts; the nanny (Lola) sees each pay period's totals and confirms them. Phone first. Site: chini-lucky.github.io/lola.

## Read first

- Spec: `docs/decisions.md` (source of truth), `docs/plan.md`, `docs/tickets.md`. Domain words: `docs/GLOSSARY.md`.
- Coding rules: `CODING_STANDARDS.md`.
- Research notes and the build process: `/home/laki/personal/chini-lucky/docs/notes/` — follow `process.md` there (worktree per ticket, TDD at seams, two-axis review, PR format; implementers never merge — the lead merges).

## Before every commit / push

- `git config user.email` must end in `users.noreply.github.com` (user `lakinduboteju`). Never the screencloud work identity.
- `gh auth status` active account must be `lakinduboteju` (`gh auth switch -u lakinduboteju`).
- `npm run check` must pass (types, lint 0 warnings, prettier, Vitest, pgTAP, db types up to date). Run `npm run e2e` when UI or flows change.

## Dev

- Slots: each checkout has its own local Supabase stack (Docker) and Vite ports, picked by a slot number, so parallel worktrees never share a DB or a dev server. The main clone is slot 0 (`supabase/config.toml` as is: project `lola`, ports 554xx, e.g. API 55421, DB 55422, Studio 55423; Vite 5173). A worktree claims the lowest free slot 1–4 on first use and keeps it in `.slot` (gitignored): project `lola-N`, every Supabase port + N×100 (slot 2: API 55621), dev Vite 5173+N, e2e Vite 5273+N. `npm run slot` prints yours; `LOLA_SLOT=N` overrides.
- `npm run up`: start this slot's Supabase (migrations + seed on first start). `npm run dev` (= `scripts/dev.sh`): `up` + Vite at http://localhost:<5173+N>/lola/.
- `npm run stop`: stop this slot's stack (slots 1–4 also drop their volumes). Run it before removing a finished worktree; `npm run stop -- N` stops slot N from anywhere.
- Every npm script that touches Supabase or Vite (`check`, `e2e`, `dev`, `db:reset`, `db:types`) targets your slot. Never run a bare `supabase start|stop|db reset|test db|gen types` in a worktree: it hits slot 0. Use the npm script or `scripts/slot.sh supabase …`. `supabase migration new` is fine bare.
- `npm run e2e` always starts its own Vite on the e2e port (never reuses a running server), so it can run beside `npm run dev`.
- Edge Functions (`supabase/functions/`, Deno; outside tsc and ESLint): `npm run up` serves the ones that exist when the stack starts, without reloading edits. While editing one, run `npm run functions` (hot reload, logs to stdout) beside it. Tested through Playwright (`e2e/remove-user.spec.ts` calls it directly).
- Logs: `logs/vite.log`, `logs/supabase-{db,auth,rest}.log` (gitignored). Playwright traces/screenshots: `test-results/`.
- Test logins: see `supabase/seed.sql` once it exists (values are not repeated here).
- `npm run db:reset` re-applies migrations + seed; `npm run db:types` regenerates `src/db.types.ts`.

## Rules

- Schema changes only via a new file in `supabase/migrations/`. Never edit an applied migration.
- All pay maths only in `src/pay.ts` (pure, tested). The DB stores raw facts.
- Permissions are enforced in the DB (RLS) and tested with pgTAP.
- Keep it simple and minimal: no new dependency without a written reason in the PR.
- Small PRs, one per ticket.
- Never run Supabase commands against production (`link`, `db push`, `config push`, `functions deploy`) from a machine: production changes only through GitHub Actions on merge to main.
  The one exception is the one-time `scripts/create-admin.ts` run (decisions.md, round 8).
