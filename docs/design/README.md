# Lola design options

Open `options.html` in a browser. Each option shows 4 phone frames (Lola month, admin month, add/edit day sheet, login) with the same Oct 2026 sample data. Mascot is the same original brown baby bear for all three options (round head, tan muzzle, pink cheeks, bow tie in the option's accent colour). Bear colours: #A8744A body, #E8C79F muzzle, #4A2E1F eyes/nose, #F2A79E cheeks.

Sample data: 6 OT entries = 15 h (rounded up to 30 min) × 150 = 2,250. Salary 20,000, total 22,250, paid 0, balance 22,250. Leave Mon 19 Oct. Holidays 13 and 23 Oct.

## Option A: Sky & Cream

- Palette: cream #FFFBF3, sky card #CFE6F7, accent #4E9BD1, ink #24384A, OT #BFE0F5, leave #FCE3C9, holiday #FFE9A8, weekend #F3EEE4.
- Fonts: Baloo 2 (display), Nunito (body).
- Feel: puffy, playful and bright like a nursery. Very round corners, pill buttons, and the bear peeks over the totals card.

## Option B: Sage & Sand

- Palette: sand #F7F2EA, card #FFFDF9, sage accent #6E9C7E, mint #DDEBDF, ink #31403A, OT #CFE3D4, leave #F1D9C9, holiday #E9E1F0.
- Fonts: Mali (display, a rounded hand-drawn face from a Thai foundry), Figtree (body).
- Feel: calm, natural, storybook. Round day dots, outlined cards, the bear sits inside the totals card.

## Option C: Navy & Butter

- Palette: white #FFFFFF, navy #1D2B4F, butter accent #FFD45C, surface #F3F5FA, OT #FFE79A, leave #D8E4FF, holiday navy with butter text.
- Fonts: Bricolage Grotesque (display), Outfit (body).
- Feel: confident, crisp and modern. A navy header band holds the totals with big butter numbers, square-ish corners, still cute because of the bear.

## Final (Option A)

`final.html` is the build blueprint: Option A only, 14 frames grouped by who sees them (Everyone, Lola, Admin, Payslip PDF), all on the Oct pay sample (28 Sep – 27 Oct 2026, total 22,250, paid 0).

Tokens (CSS custom properties in `final.html`):

- Surfaces: `--bg` #FFFBF3, `--surface` #FFFFFF, `--line` #DCE6EE, `--ink` #24384A, `--muted` #6F7F8C, `--scrim` #24384A55.
- Accent: `--accent` #4E9BD1, `--accent-ink` #2D6E9E, `--accent-soft` #DDEEFA, `--accent-on` #FFFFFF.
- Totals card: `--t-bg` #CFE6F7, `--t-ink` #1F3B52, `--t-line` #A9CDE6, `--t-bal` #FFFFFF.
- Day types: `--day` #FFFFFF, `--wkd` #F3EEE4, `--ot` #BFE0F5 / `--ot-ink` #1C5A86, `--lv` #FCE3C9 / `--lv-ink` #B8692A, `--hol` #FFE9A8 / `--hol-ink` #8A6A00.
- Status: `--ok` #E0F2E4 / `--ok-ink` #2F6B3F (paid, confirmed), `--danger` #C2554A / `--danger-soft` #FBE4E1.
- Bear: `--bear` #A8744A, `--bear-lt` #E8C79F, `--bear-dk` #4A2E1F, `--cheek` #F2A79E, `--bow` #4E9BD1.
- Radii: `--r-card` 26px, `--r-day` 14px, `--r-item` 18px, `--r-btn` 999px (pill).
- Fonts: `--font-d` Baloo 2 (display, numbers), `--font-b` Nunito (body).

Components (class names): `top` (greeting header), `period` (‹ Oct pay · 28 Sep – 27 Oct ›), `totals` + `peek` bear, `rows`, `bal` / `bal.paid`, `card` + `dow`/`cal`/`d` (day cell: `ot`, `lv`, `hol`, `wkd`, `today`, month tag `m`), `legend`, `list` + `item` + `chip` (`ot`, `lv`, `hol`, `pay`), `pen` (edit), `empty`, `pay` + `rc` (receipt thumbnail, `dl` download / `x` remove, `add` tile), `btn` (`pri`, `sec`, `dash`, `bad`, `sm`), `link`, `state` (confirmation pill, `ok`), `flag` ("Changed since Lola confirmed"), `done` (confirmed), `toast`, `sheet` + `scrim` + `grab`, `field` + `inp`/`select`/`textarea`, `range` (OT time range with remove), `calc`, `quick`, `toggle` + `sw-in`, `seg` (role picker), `bar` (sub-page header with back), `sec` (settings section), `kv`, `hist` (rate history), `navrow`, `count`, `prow` + `av` (people rows), `log` + `lg` + `op` (change log), `login` + `a2hs` (Home Screen hint), `a4` + `stamp` (payslip PDF, DRAFT).
