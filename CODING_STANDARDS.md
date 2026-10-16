# Coding standards

Tooling (strict TypeScript, ESLint `strictTypeChecked`, Prettier) enforces most rules; these are the ones to keep in mind.

1. **No `any`, no non-null `!`, no casts** — except at the Supabase response edge (`src/supabase.ts`).
   ```ts
   const day = days.find((d) => d.date === date); // Day | undefined
   if (day === undefined) return null; // never `days.find(...)!`
   ```
2. **Await every promise, or mark it `void`.**
   ```ts
   void supabase.auth.signOut(); // fire-and-forget is explicit
   ```
3. **Exhaustive `switch` with a `never` check.**
   ```ts
   switch (kind) {
     case "ot":
       return "OT";
     case "leave":
       return "Leave";
     default: {
       const unreachable: never = kind;
       return unreachable;
     }
   }
   ```
4. **One component per screen file** in `src/screens/`. Shared bits go in `src/ui.tsx`.
5. **Dates are `YYYY-MM-DD` strings, times `HH:MM`**, Bangkok local time. No date library.
6. **No new dependency** without a written reason in the PR.
7. **Test names describe the rule**, using the words in `docs/GLOSSARY.md`.
   ```ts
   test("weekday OT counts only time after 18:00", ...);
   ```
