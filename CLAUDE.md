# Lola — agent guide

Nanny hours and pay app: an admin records exceptions (OT, leave), payments and receipts; the nanny (Lola) sees each pay period's totals and confirms them. Phone first. Site: chini-lucky.github.io/lola.

## Read first

- Spec: `docs/decisions.md` (source of truth), `docs/plan.md`, `docs/tickets.md`. Domain words: `docs/GLOSSARY.md`.
- Coding rules: `CODING_STANDARDS.md`.
- Research notes and the build process: `/home/laki/personal/chini-lucky/docs/notes/` — follow `process.md` there (worktree per ticket, TDD at seams, two-axis review, PR format, never merge).

## Before every commit / push

- `git config user.email` must end in `users.noreply.github.com` (user `lakinduboteju`). Never the screencloud work identity.
- `gh auth status` active account must be `lakinduboteju` (`gh auth switch -u lakinduboteju`).
- `npm run check` must pass (types, lint 0 warnings, prettier, Vitest, pgTAP, db types up to date). Run `npm run e2e` when UI or flows change.

## Dev

- `npm run dev` (= `scripts/dev.sh`): starts local Supabase (Docker) + Vite at http://localhost:5173/lola/.
- Logs: `logs/vite.log`, `logs/supabase-{db,auth,rest}.log` (gitignored). Playwright traces/screenshots: `test-results/`.
- Local Supabase uses ports 554xx (see `supabase/config.toml`), e.g. API 55421, DB 55422, Studio 55423.
- Test logins: see `supabase/seed.sql` once it exists (values are not repeated here).
- `npm run db:reset` re-applies migrations + seed; `npm run db:types` regenerates `src/db.types.ts`.

## Rules

- Schema changes only via a new file in `supabase/migrations/`. Never edit an applied migration.
- All pay maths only in `src/pay.ts` (pure, tested). The DB stores raw facts.
- Permissions are enforced in the DB (RLS) and tested with pgTAP.
- Keep it simple and minimal: no new dependency without a written reason in the PR.
- Small PRs, one per ticket.
