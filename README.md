# Lola

Nanny hours and pay app for the Chini Lucky family.

- Spec: `docs/decisions.md`, `docs/plan.md`. Agents: `CLAUDE.md`.
- Needs Node 24, Docker and the Supabase CLI 2.121.0.
- `npm ci`, then `npm run dev` → http://localhost:5173/lola/
- `npm run check` (all static checks + unit + DB tests), `npm run e2e` (Playwright).
