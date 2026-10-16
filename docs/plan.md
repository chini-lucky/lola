# Lola — implementation, testing and deployment plan

Source of truth: `docs/decisions.md`. This plan follows it. Rule for every step: simple, clean, minimal. If something is not needed, leave it out.

## 1. Repo layout (`chini-lucky/lola`, public)

```
lola/
  CLAUDE.md                 # how agents work here (short)
  CODING_STANDARDS.md       # rules + examples
  README.md
  package.json  tsconfig.json  eslint.config.js  .prettierrc  vite.config.ts  playwright.config.ts
  index.html
  public/
    manifest.webmanifest  icon-192.png  icon-512.png  apple-touch-icon.png   # installable, no service worker
    fonts/                             # Baloo 2 + Nunito woff2, self-hosted
    bear.svg
  src/
    main.tsx  App.tsx       # App = auth gate + tiny hash "router" (switch on location.hash)
    supabase.ts             # client + typed helpers
    db.types.ts             # generated: npm run db:types
    pay.ts  pay.test.ts     # ALL pay maths (pure)
    csv.ts  csv.test.ts     # pure: rows -> CSV string
    payslip.ts              # jsPDF, lazy-loaded
    receipts.ts             # canvas shrink + upload
    screens/  Login.tsx  Waiting.tsx  Period.tsx  DaySheet.tsx  Payments.tsx  Settings.tsx  Account.tsx  Audit.tsx
    ui.tsx                  # the few shared bits (Card, Button, Sheet)
    styles.css              # Option A CSS variables + all styles
  supabase/
    config.toml             # also prod auth settings (`supabase config push`)
    functions/remove-user/  # only Edge Function: reject/remove (deletes auth user)
    migrations/             # only way to change schema
    seed.sql                # local only: users, rates, holidays 2026–27, Sept/Oct sample
    tests/                  # pgTAP: rls.test.sql, audit.test.sql
  e2e/  lola.spec.ts  admin.spec.ts
  scripts/dev.sh            # starts supabase + vite, writes logs/
  scripts/create-admin.mjs  # one-time: prod admin `chini-lucky`, password → file outside repo
  logs/                     # gitignored
  .github/workflows/  ci.yml  deploy.yml  weekly.yml
```

- Runtime dependencies: `react`, `react-dom`, `@supabase/supabase-js`, `jspdf`. That's all.
- Dev dependencies: vite, @vitejs/plugin-react, typescript, vitest, @playwright/test, eslint, typescript-eslint, eslint-plugin-react-hooks, prettier.
- No router, no state library, no CSS framework, no UI kit, no date library (dates are `YYYY-MM-DD` strings, times `HH:MM`, all Bangkok local time).

## 2. Agent environment ("pit of success") — P0, before any feature

- **Git identity (first command after `git init`):** `git config user.name lakinduboteju`, `git config user.email <id>+lakinduboteju@users.noreply.github.com` (id from `gh api user -q .id`). CLAUDE.md tells agents to check `git config user.email` and `gh auth status` (active account `lakinduboteju`) before any commit/push. Never the screencloud identity.
- **CLAUDE.md (≤60 lines):** what the app is; where decisions live; "run `npm run check` before every commit"; how to start dev (`scripts/dev.sh`); where logs are (`logs/vite.log`, `logs/supabase-*.log`); test logins (pointer to `supabase/seed.sql`, values not repeated); rules "schema only via new migration", "pay maths only in `src/pay.ts`"; small PRs, one per phase.
- **CODING_STANDARDS.md (short):** no `any`, no non-null `!`, no casts except at the Supabase response edge; await every promise or mark `void`; exhaustive `switch` with `never` check; one component per screen file; no new dependency without a written reason in the PR; test names describe the rule.
- **TypeScript:** `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noUnusedLocals/Parameters`, `verbatimModuleSyntax`.
- **ESLint:** `typescript-eslint` `strictTypeChecked` + `stylisticTypeChecked`, plus `no-floating-promises`, `no-misused-promises`, `switch-exhaustiveness-check`, `no-explicit-any`, `strict-boolean-expressions`, `eqeqeq`, `no-console` (error), react-hooks rules. `--max-warnings 0`.
- **Prettier:** defaults, `printWidth 100`.
- **Scripts:**
  - `check` = `tsc -b && eslint . --max-warnings 0 && prettier --check . && vitest run && supabase test db && npm run db:types:check`
  - `db:types` = `supabase gen types typescript --local > src/db.types.ts`; `db:types:check` fails if out of date.
  - `e2e` = `playwright test` (local Supabase + Vite).
  - `db:reset` = `supabase db reset` (migrations + seed).
- **Local Supabase:** `supabase init`; `supabase start` (Docker). `seed.sql` creates:
  - users `chini-lucky` (admin), `lola` (nanny), `newbie` (waiting) — local-only passwords;
  - rate from 2026-09-14 (20,000 / 150), Thai holidays 2026–27, Sept override 11,000;
  - Sept payment 11,000 on 28 Sep;
  - Oct design sample: 6 OT entries = 15 h, leave 19 Oct, holidays 13 + 23 Oct, no Oct payment.
- **Login (same local, CI and prod):** username + password. Username `^[a-z0-9-]{3,20}$` → hidden email `{username}@lola.invalid`; `config.toml`: confirmations off, `minimum_password_length = 10`, no SMTP, no other providers. supabase-js keeps the session (localStorage + auto refresh) until Log out.
- **Logs agents can read:** `scripts/dev.sh` runs `supabase start`, follows `docker logs -f` for db/auth/rest into `logs/supabase-{db,auth,rest}.log`, and runs `vite 2>&1 | tee logs/vite.log`. Playwright keeps traces/screenshots in `test-results/`.
- **Claude permissions (approved):** project `.claude/settings.json` allowlisting `npm run *`, `supabase *`, and read-only `git` commands so agents aren't blocked.

## 3. Data model (Postgres, all access via RLS)

- **people:** `id uuid pk → auth.users on delete cascade`, `username unique` (regex check), `role text check in ('admin','nanny','waiting') default 'waiting'`, `created_at`. Trigger on `auth.users` insert creates the row as `waiting`, username from signup metadata (bad username → sign-up fails).
- **days:** `date date pk`, `ot text[] default '{}'` (each `"HH:MM-HH:MM"`, regex check), `leave bool default false`, `note text`, `updated_at`. Rows only for exception days.
- **payments:** `id uuid pk`, `period_end date` (check day = 27), `paid_on date`, `amount int > 0` (whole THB), `note`, `receipts text[] default '{}'` (storage paths), `created_at`.
- **rates:** `effective_from date pk`, `salary int`, `ot_rate int`.
- **holidays:** `date date pk`, `name`.
- **period_overrides:** `period_end date pk`, `salary int`, `note` (row: 2026-09-27 = 11,000).
- **confirmations:** `id`, `period_end`, `snapshot jsonb` (summary numbers at confirm time), `confirmed_by uuid default auth.uid()`, `confirmed_at default now()`. Latest row per period counts.
- **audit_log:** `id bigserial`, `at`, `actor`, `tbl`, `op`, `old jsonb`, `new jsonb`. One generic `security definer` trigger on all tables above (people: role changes only).
- **Helper:** `my_role()` — stable, security definer, returns role for `auth.uid()` or null.
- **`set_role(target, role)` RPC** (security definer; approve = `set_role(id,'nanny')`): caller must be admin, `target <> auth.uid()`, role in admin/nanny. Only way to change roles → guard + audit in one tested place.
- **Edge Function `remove-user`** (reject = remove a waiting user): deleting auth users needs the service role, so this one function checks the caller's JWT is admin and target ≠ caller, then `auth.admin.deleteUser` (people row cascades; function writes the audit row with the caller as actor). No other server code: own password via `supabase.auth.updateUser({ password })`; no resetting others' passwords (forgot = remove + sign up again).
- **RLS:**
  - Data tables: select if `my_role() in ('admin','nanny')`; insert/update/delete if `my_role() = 'admin'`.
  - confirmations: nanny + admin select; nanny insert only with `confirmed_by = auth.uid()`; no update/delete.
  - people: select own row (so waiting users see "Waiting for approval"); admin selects all; no direct writes (only `set_role` / `remove-user`).
  - audit_log: admin select only; no direct writes.
  - Waiting/unknown users: nothing.
- **Storage:** private bucket `receipts`, path `{period_end}/{payment_id}/{file}`. Admin + nanny read via signed URLs; only admin writes/deletes.
- **Migrations:** `0001_schema`, `0002_rls`, `0003_audit`, `0004_storage`, `0005_holidays_2026_2027` (holidays, first rate and Sept override are real data → migration, not seed).

## 4. Pay module (`src/pay.ts`, pure, no I/O)

**Rules:**

- **Period:** day ≥ 28 → period ending 27th of next month; else period ending 27th of this month. Label from end month ("Oct pay" = 28 Sep – 27 Oct). First period 14–27 Sep 2026 (start date clamps). Nothing before 2026-09-14.
- **Off day:** Sat, Sun, or a holiday.
- **Day OT minutes:** sum of the day's ranges (never cross midnight; split across two days). Off day: whole range counts. Weekday: only parts before 09:00 or after 18:00.
- **Rounding:** day total rounded UP to next 30 min (once per day, not per range).
- **Day OT pay:** rounded hours × OT rate in effect that day, whole baht.
- **Salary:** `period_overrides.salary` if present (Sept 11,000 = salary only, OT on top), else salary in effect on period start (a raise applies from the next period). Holidays/leave don't change salary.
- **Totals:** `total = salary + Σ OT pay`; `paid = Σ payments where period_end = period`; `balance = total − paid`.
- **Day kind (colours):** OT > leave > holiday > weekend > normal.
- **Stale confirmation:** money numbers changed — latest snapshot (total, paid) ≠ current. Note-only edits don't count.
- **Functions:** `periodOf`, `periodByEnd`, `nextPeriod`/`prevPeriod`, `datesIn`, `otMinutes`, `roundUp30`, `rateOn`, `summarize`, `dayKind`, `isStale`, `summaryText`.

**Test cases (Vitest):**

- Rounding: 18:00–18:01 → 30; 18:00–18:30 → 30; 18:00–18:31 → 60; 18:00–20:30 → 150 (375 THB).
- Several ranges: 07:00–08:10 + 18:00–18:20 → 90; 07:30–08:00 + 18:00–18:10 → 40 → 60 (per day, not per range).
- Weekday clipping: 08:00–10:00 → 60; 17:00–19:00 → 60; 10:00–17:00 → 0; 08:00–19:00 → 120.
- Weekend: Sat 10:00–14:00 → 240; Sun 09:00–09:10 → 30.
- Holidays: weekday holiday 09:00–18:00 → 540; holiday on weekend counts once; holiday with no row → 0, salary unchanged.
- Leave: no deduction, listed; leave + OT same day → both.
- Override: Sept salary 11,000; paid 11,000 → balance 0.
- Rate change: OT rate change mid-period → each day uses its own rate; salary change mid-period → old salary until next period.
- Boundaries: 27 Oct → Oct pay; 28 Oct → Nov pay; 14 Sep → first period; 13 Sep → none; 28 Dec 2026 → Jan pay 2027; Feb (28 Jan – 27 Feb) and leap year 2028.
- Prev/next: prev of Oct pay = first period; next of Dec pay = Jan.
- Full Oct sample: 15 h, 2,250 OT, total 22,250, paid 0, balance 22,250.
- Stale: unchanged → false; note edited → false; payment added → true.
- CSV: one row per day across 2 periods, payment amount on paid_on day, receipt names, quotes/commas escaped.

## 5. Build phases (one small PR each; `npm run check` green = minimum done)

- **P0 Scaffold + agent environment.** Everything in §2, empty Vite app, `ci.yml` running check + e2e on every PR. Done: CI green on a "hello" page; commits show the noreply email.
- **P1 DB + RLS + audit + seed.** Migrations, seed, pgTAP tests, `db.types.ts`. Done: `supabase db reset` works; tests prove admin all / nanny read + confirm / waiting & anon nothing; `set_role` guards (non-admin, self); every write audited; storage policies tested.
- **P2 Pay module.** `pay.ts` + all §4 tests, 100% branch coverage. _Parallel with P1, P3._
- **P3 Design update.** Option A frames → 28→27 period: header "Oct pay · 28 Sep – 27 Oct" with ‹ › by period, grid starting 28 Sep, receipt thumbnails under Payments, "Download payslip", "Changed since Lola confirmed". Done: user approves. _Parallel with P1, P2._
- **P4 Deploy skeleton + admin.** `deploy.yml`, prod Supabase link, migrations + `config push` + function deploy on merge, manifest + icons; then run `create-admin.mjs` once. Done: chini-lucky.github.io/lola loads and installs; password file exists outside the repo.
- **P5 Core screens.** Login / Sign up (username + password, "Add to Home Screen" hint), Waiting, Account (change password, Log out), Period view (totals card with bear, grid, OT/leave list, ‹ ›), Lola's "This looks right ✓", admin DaySheet. Done: Playwright covers Lola + admin flows on seed; matches P3 frames at 390px.
- **P6 Payments + receipts.** Add/list payments (default current period), canvas shrink (max 1600px, JPEG 0.8), multi-file upload, signed-URL view/download. HEIC the browser can't decode → upload original. Done: e2e adds payment with 2 files; Lola downloads. _Parallel with P7._
- **P7 Settings + people + audit + copy summary.** Rate history, holidays add/remove, People (waiting: Approve / Reject; approved: role picker + Remove, hidden for self), audit list, "Copy summary", stale badge. Done: e2e approves waiting user who then sees Period view; reject and role change work. _Parallel with P6._
- **P8 CSV + payslip PDF.** Period range → one CSV. jsPDF lazy-loaded, embedded fonts + bear, all decisions.md fields, "DRAFT" if period not ended or balance > 0. Done: CSV tests pass; e2e downloads both, PDF contains "Payslip · Oct pay".
- **P9 Backup + ping + go-live.** `weekly.yml`, prod smoke test. Done: first backup commit (DB + receipts) in `lola-backup`; Lola signed up, approved, confirms Oct pay.

**Order:** P0 → (P1 ∥ P2 ∥ P3) → P4 → P5 → (P6 ∥ P7) → P8 → P9.

## 6. Testing

- **Unit (Vitest):** `pay.ts`, `csv.ts`. Pure, fast, run first.
- **DB/RLS (pgTAP, `supabase test db`):** every table × role (admin, nanny, waiting, anon) via `set local role authenticated` + `request.jwt.claims`. Also audit trigger, people trigger (username check), `set_role` guards, storage policies.
- **E2E (Playwright, Chromium mobile viewport):** against `supabase start` (incl. functions) + `vite`, `db reset` per spec file, seed logins.
  - Lola: sees Oct totals, confirms, no edit controls, downloads receipt + payslip; changes own password, logs out/in.
  - Admin: edits day → totals update, confirmation stale; adds payment; exports CSV.
  - Access: sign up → Waiting → admin Approves → Period view; Reject removes; nanny → admin role change; no role/Remove controls on self.
- **CI (`ci.yml`, every PR + push to main):** node + supabase CLI (pinned 2.121.0) → `supabase start` → `npm ci` → `npm run check` → playwright install chromium → `npm run e2e`; upload traces on failure; branch protection requires it.

## 7. Deployment

- **Frontend:** `deploy.yml` on push to main: check → `vite build` (`base: '/lola/'`) → `actions/deploy-pages`. Hash routes (`#/settings`) avoid Pages 404s.
- **Database + auth:** same workflow, before build: `supabase link --project-ref $SUPABASE_PROJECT_REF` → `supabase db push` → `supabase config push` → `supabase functions deploy remove-user`. Any failure → nothing deploys.
- **Admin account (once, after first deploy):** `node scripts/create-admin.mjs` (service role key fetched with `supabase projects api-keys`, never stored) → `auth.admin.createUser` for `chini-lucky` with a random 32-char password, role admin → password written to `~/lola-admin-password.txt` (mode 600). Never printed, never in chat or repo.
- **Weekly (`weekly.yml`, Mon 03:00 UTC + manual):** `supabase db dump` (schema + data) + receipt files (`supabase storage cp -r`) → commit dated files to private `chini-lucky/lola-backup`. This run is also the keep-alive ping; a `curl` to the REST health endpoint covers dump failure.
- **Secrets:** `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `SUPABASE_PROJECT_REF`, `BACKUP_REPO_TOKEN` (fine-grained PAT, contents r/w on `lola-backup` only).
- **Variables (public anyway):** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- **Prod auth (from `config.toml`):** email/password only, sign-ups on, confirmations off, min password 10, no captcha, no SMTP; Site URL `https://chini-lucky.github.io/lola/`.

## 8. Steps only the user can do

1. Create a Supabase account (personal email) and project `lola` (Singapore, free). Save the DB password. Share project ref, URL, anon key.
2. Create a Supabase access token; add `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `SUPABASE_PROJECT_REF` as GitHub repo secrets.
3. Create private repo `chini-lucky/lola-backup` + fine-grained PAT for it only → `BACKUP_REPO_TOKEN`.
4. Enable GitHub Pages (Source: GitHub Actions) on `chini-lucky/lola`.
5. After P4: copy the password from `~/lola-admin-password.txt` into a password manager, then delete the file.
6. Ask Lola to sign up (and Add to Home Screen), then tap **Approve** in Settings → People.

## 9. Risks and open items

**Open, need the user's answer:**

1. Fractional OT amounts (odd OT rate): round each day to whole baht? (Plan assumes yes.)
2. Final period if Lola stops: prorate? (Decided later.)

**Risks:**

- Open sign-up without captcha: strangers can create waiting accounts (they see nothing); admin Rejects them.
- iOS Safari clears site data after ~7 days unused unless installed → "Add to Home Screen" hint.
- No password reset: forgotten admin password = only the other admin (or SQL via dashboard) can fix it.
- Free plan pauses after 7 idle days; weekly job covers it; GitHub emails on failure.
- HEIC on Android/Chrome can't be shrunk → original uploaded.
- jsPDF + fonts ≈ 300 KB, lazy-loaded.
- Supabase CLI version in CI must match local (pin 2.121.0).
