# Lola app — decisions

Source of truth for agreed decisions. Update when the user decides something new.

## Identity / hosting

- Site: chini-lucky.github.io/lola (repo `chini-lucky/lola`, public).
- Git commits use the user's PERSONAL GitHub identity (lakinduboteju, personal/noreply email). Never the work identity (screencloud).
- Strict anonymity not required, but no work account anywhere.

## Auth

- Facebook login via Supabase Auth.
- Admin = shared Facebook account "chini lucky" (records data).
- Viewer = Lola's own Facebook account (read only).
- Backup admin login: email magic link (hidden), in case Facebook breaks.
- Meta app must be Live → site hosts privacy policy + data-deletion pages.

## Pay rules

- Salary 20,000 THB/month for Mon–Fri 09:00–18:00 (lunch included, no effect on pay).
- OT = 150 THB/hour: weekday before 09:00 or after 18:00, any hours Sat/Sun, any hours on a public holiday.
- OT rounded UP to the nearest 30 minutes.
- Thai public holidays: paid day off.
- Leave/absence: recorded for visibility only, no deduction.
- Recording: every weekday is a normal day by default; admin records only exceptions (OT, leave, different times).
- Payments recorded (date, amount, note); balance per month = owed − paid.
- Start date 2026-09-14. Sept salary = 11,000 THB (agreed, not formula), paid 11,000. Oct unpaid.

## Lola's view

- Monthly summary (salary + OT hours + OT pay = total, paid, balance) + day-by-day list of OT/leave. No edit controls.
- Language: English.

## Screens (round 2, agreed)

- Shared: login; month view = totals card on top + calendar grid with coloured days (normal / OT / leave / holiday / weekend) + list of OT/leave days below.
- Admin only: add/edit day (OT as time range e.g. 18:00–20:30, leave, note); payments (add/list); settings (salary + OT rate with effective-date history, holidays, approve users).
- Lola: same month view, read only, plus one action: "This looks right ✓" to confirm a month.
- "Copy summary" button (admin): short text + link to paste into Messenger. No in-app notifications.
- Holidays: Thai public holidays 2026–2027 preloaded, admin can add/remove.
- Access: only admin + Lola. Lola's first login → admin taps Approve. Others see "Not invited".
- Public pages: privacy policy, data deletion.
- Phone first, light mode only.
- Personal touch: baby nickname "Pooh"; mascot = cute brown baby bear (original art, NOT Winnie the Pooh). Greetings like "Hi Lola 👋".

## New requirements (user, round 3)

- Pay day is the 28th of every month. Pay is per pay period ending around the 28th (e.g. "Oct pay" = 28 Sep → 28 Oct), not calendar month. Exact boundary TBD (round 4).
- Admin uploads bank-transfer receipt images when recording a payment; Lola can open a past period and download them.
- Admin can download a CSV of data for a chosen date range.
- (round 4) Pay period = 28th of previous month → 27th of this month; main screen + calendar grid show one pay period; ‹ › move by period.
- (round 4) Only ONE CSV file per export (not two).
- (round 4) Lola (and admin) can download a detailed payslip PDF per pay period.

## Round 3–5 (all recommendations accepted)

- Supabase free plan, project `lola`, region Singapore. Weekly GitHub Action ping to stop free-plan pausing.
- DB stores raw facts only; ALL pay maths in one pure, tested TS module.
- Tables: people (role admin/viewer/waiting), days (date, 1+ OT ranges, leave flag, note), payments (date paid, period, amount, note, receipt files), rates (salary + OT rate, effective from), holidays, period_overrides (Sept period = 11,000), confirmations (period, total snapshot, at).
- Several OT ranges per day allowed; rounding (up to 30 min) applied to the DAY's total OT.
- Payment picks its period; defaults to current period. Payment records real date paid.
- Period dates fixed (28th→27th) regardless of actual pay date.
- First period: 14 Sep – 27 Sep 2026 = 11,000, fully paid on 28 Sep. Next: 28 Sep – 27 Oct ("Oct pay").
- Permissions enforced in DB (RLS) with tests: admin all; Lola read + add confirmation; waiting/unknown nothing.
- Audit log of every add/edit/delete (admin-only view).
- Confirmation goes stale if period data changes after it → "Changed since Lola confirmed".
- Weekly backup export to PRIVATE repo chini-lucky/lola-backup.
- Schema changes only via migrations in repo, applied by GitHub Actions on merge to main.
- Receipts: images (JPG/PNG/HEIC) + PDF, several per payment, shrunk in browser, private storage bucket (admin + Lola only). Lola views/downloads under the period's Payments.
- CSV: pick a range of pay periods → ONE CSV, one row per day: date, weekday, type, OT times, OT hours, OT pay, note, payment amount (on day paid), receipt file names.
- Payslip PDF (per period, admin + Lola): bear logo, "Payslip · Oct pay (28 Sep – 27 Oct 2026)", Employee: Mrs. Lennie Cartagena Deborja, Employer: Lakindu Boteju & Sachini Attanayake; salary; OT table per day + total; leave/holidays listed (no deduction); total due, payments (date+amount), balance; confirmation status. Downloadable anytime; "DRAFT" stamp if period not over or not fully paid. Generated client-side, styled like Option A.

## Round 6 (user)

- Facebook login DROPPED (too risky). Replaced by email one-time code (OTP) login, approved users only. Details in round 7; plan.md auth sections must be replanned before building.
- Admin Settings must let admin set monthly salary and OT rate (already planned via `rates` with effective date).

## Round 7 (user) — supersedes OTP idea

- NO Facebook, NO email OTP, NO new Gmail.
- Username + password login. Anyone can sign up; new users are locked out until admin approves.
- Admin account username `chini-lucky`, long auto-generated password given to the user after deploy (user saves it in a password manager).
- Logged in forever unless the user logs out.

## Round 8 (all recommendations accepted, plus role change)

- Roles: `admin` and `nanny` (replaces "viewer"). Status before approval: waiting (locked out).
- Approve → role `nanny` by default. Admin can change the role of any approved user (nanny ↔ admin). Guard: an admin can't change their own role or remove themselves (no lock-out).
- Username 3–20 chars [a-z0-9-]; password ≥ 10 chars. Username mapped to a hidden synthetic email; email confirmations off; no emails ever sent.
- Forgotten password: admin removes the account, user signs up again, admin approves. No reset feature.
- Settings → People: waiting users with Approve / Reject (reject deletes), approved users with role picker and Remove.
- Account section: change own password; Log out.
- Admin `chini-lucky` created by a one-time script after first deploy; generated long password saved to a file OUTSIDE the repo (e.g. ~/lola-admin-password.txt); user copies to password manager and deletes the file. Never in chat or repo.
- Stay logged in until logout. App is installable (manifest + bear icon); login screen tells users to "Add to Home Screen" (iOS Safari clears data after ~7 days otherwise).
- No privacy/data-deletion pages needed anymore. No captcha.
- Round 6 answers: salary raise applies from the next period; Sept 11,000 = salary only, no OT; OT ranges don't cross midnight; weekly backup includes receipt files; "stale" = money numbers changed; final part-month decided later; project `.claude/settings.json` allowlist (npm, supabase, read-only git) approved; build starts after the updated plan is shown.

## Guiding principle

- Keep everything simple, clean and minimal — features, code, file organisation. Fewer dependencies, fewer abstractions.

## Design (chosen)

- Option A "Sky & Cream" from docs/design/options.html (palette/fonts in docs/design/README.md). Artifact: https://claude.ai/artifact/JCEiVAU4Pu5eWxTZt76sU2

## Stack

- Vite + React + TypeScript (strict), Vitest (pay maths), Playwright (e2e), Supabase local in Docker for dev.

## Process order (user's choice)

1. Decide what the frontend shows (screens + content).
2. Design: show the user several design options to choose from. Theme: modern, minimal, warm, cute, baby-boy colours.
3. Then backend + database design.
4. Then implementation, testing, deployment plan.
