# Glossary

Domain words used in code, tests, UI and PRs. Use these exact words.

- **Pay period** — the span one month's pay covers: the 28th of the previous month to the 27th of this month. Named by its end month ("Oct pay" = 28 Sep – 27 Oct). The first pay period is 14 Sep – 27 Sep 2026. Pay day is the 28th.
- **OT (overtime)** — time worked outside normal hours: weekdays before 09:00 or after 18:00, any time on Sat/Sun, any time on a holiday. A day's OT total is rounded up to the next 30 minutes and paid at the OT rate (150 THB/hour to start).
- **Leave** — a day the nanny did not work. Recorded for visibility only; no deduction from salary.
- **Holiday** — a Thai public holiday: a paid day off. Any work on it is OT. Preloaded for 2026–2027; admin can add/remove.
- **Admin** — a role that records and edits everything (days, payments, settings, people) and sees the change log. The first admin account is `chini-lucky`.
- **Nanny** — a role that reads pay data (days, payments, receipts, rates, holidays) and can confirm a pay period; no edits, no change log. Lola's account.
- **Waiting** — status of a new sign-up before an admin approves it; locked out, sees only "Waiting for approval".
- **Approved** — an admin or a nanny: a person an admin has approved (Approve makes a waiting person a nanny).
- **Reject / Remove** — an admin deleting an account: Reject for a waiting sign-up, Remove for an approved person. Never your own. A forgotten password = Remove, sign up again, Approve.
- **Confirmation** — the nanny's "This looks right ✓" on a pay period; stores a snapshot of the money numbers at that moment.
- **Stale** — a confirmation whose money numbers (total, paid) no longer match the current ones; shown as "Changed since Lola confirmed". Note-only edits don't make it stale.
- **Receipt** — an image or PDF of a bank transfer, attached by the admin to a payment; the nanny can view and download it.
- **Payslip** — a PDF per pay period with salary, OT per day, leave/holidays, total due, payments and balance; stamped "DRAFT" if the period isn't over or isn't fully paid.
