# Business-hours picker on `/get-listed` — Design

**Date:** 2026-07-29
**Status:** Approved (design), pending spec review

## Goal

Replace the free-text "Business hours" input on the public `/get-listed` form with
a structured picker:

- 7 selectable day **bubbles** (Sunday–Saturday), multi-select ("all that apply").
- A **From** time = hour dropdown (1–12) + AM/PM dropdown.
- A **To** time = hour dropdown (1–12) + AM/PM dropdown.

The value is still persisted as a single **string** in the existing
`golden_pages_profiles.business_hours` column, formatted the same shape as the
current free-text convention (placeholder `Mon–Fri 9am–6pm`).

## Current state

- `app/(public)/get-listed/page.tsx:106–108` — a single `<Input name="business_hours">`
  inside a server-component form that posts to the `submitListing` server action.
- `app/(public)/get-listed/actions.ts:45` — stores `str(formData, 'business_hours')` raw.
- `lib/submission-guard.ts:30` — caps `business_hours` at 120 chars.
- The stored string is rendered as-is on the public listing detail
  (`app/(public)/golden-pages/[id]/page.tsx:70`), the admin detail
  (`app/(admin)/admin/golden-pages/[id]/page.tsx:71`), and directory cards
  (`components/golden-pages/DirectoryListings.tsx:160`).
- `business_hours` is a nullable `text` column
  (`supabase/migrations/20260530222517_initial_schema.sql:78`).

## Decisions

1. **Stored format:** `Sun, Mon, Tue 9am–6pm`
   - Days: **always a comma-separated list** of 3-letter abbreviations (no range
     collapsing), in calendar order **starting Sunday** (matches the Sun→Sat bubble
     order). Example for a Mon–Fri business: `Mon, Tue, Wed, Thu, Fri 9am–6pm`.
   - Time: lowercase, no space, en-dash (`–`, U+2013) between from/to: `9am–6pm`.
   - `12` + AM → `12am`; `12` + PM → `12pm` (no numeric normalization; the picker
     only offers 1–12 + AM/PM, so times are always on the hour).
2. **Required:** business hours is now **always required**. A valid submission needs
   **at least one day** and **both** a complete From time and a complete To time.
   (This changes prior behavior where the field could be omitted entirely.)
3. **Dropdown defaults:** hour and AM/PM selects start on a disabled `Select…`
   placeholder — no time is assumed until the user chooses (consistent with the
   existing Service Type select).
4. **No start/end ordering check:** overnight ranges (e.g. `9pm–2am`) are allowed.
5. **Formatting happens server-side**, in the action, from structured fields — not
   in the browser. Single authoritative formatter; not spoofable by a crafted client.
6. **No database change.** Column stays `text`; existing rows unchanged; assembled
   string is well under the 120-char cap.

## Approach

The client picker submits structured form fields; the server action assembles and
validates the string. Rejected alternative: assembling the string in the browser
into a hidden input — duplicates the formatting logic client-side and is bypassable.

### Data flow

```
BusinessHoursPicker (client component)
  → native form fields: day (×N, values 0–6), start_hour, start_ampm, end_hour, end_ampm
  → submitListing action (server)
      → formatBusinessHours(...) → "Mon, Tue, Wed 9am–6pm"   (or → error=missing)
      → insert into golden_pages_profiles.business_hours (text, unchanged)
```

## Components

### 1. `lib/business-hours.ts` (new) — pure formatter

```ts
type AmPm = 'AM' | 'PM'

interface BusinessHoursInput {
  days: number[]          // 0=Sun … 6=Sat, any order/dupes
  startHour: number | null
  startAmPm: AmPm | null
  endHour: number | null
  endAmPm: AmPm | null
}

// Returns the formatted string, or null if the input is incomplete
// (no days, or either time missing). No DB/React dependency.
function formatBusinessHours(input: BusinessHoursInput): string | null
```

- Dedupe + sort `days` ascending (Sun-first), map to `['Sun','Mon',…]`.
- Format each time as `${hour}${ampm.toLowerCase()}` → `9am`, `12pm`.
- Join: `${dayList} ${start}–${end}`.
- Returns `null` when days is empty or either time is incomplete → the action maps
  that to the "missing" error.

### 2. `components/get-listed/BusinessHoursPicker.tsx` (new) — client island

- `'use client'`. The only interactive part of an otherwise server-rendered form.
- **Day bubbles:** 7 toggle buttons Sun–Sat. Each toggles a hidden
  `<input name="day" value={index}>` so the native form submits `formData.getAll('day')`.
  Selected = filled gold circle; unselected = outlined. Uses existing Tailwind
  tokens (`gold`, `cream`, etc.) to match the form's styling.
- **Times:** two labeled rows — "From" (`start_hour`, `start_ampm`) and "To"
  (`end_hour`, `end_ampm`) — using the existing `Select` component from
  `components/ui/Input`. Hours 1–12; AM/PM. All default to a disabled `Select…` option.
- No client-side submit blocking is required for correctness (the server validates),
  but the day buttons and selects should carry appropriate `aria` labels for a11y.

### 3. `app/(public)/get-listed/page.tsx` — wire-up

- Replace the `business_hours` `<div>` (lines 105–108) with `<BusinessHoursPicker />`.
- Keep the surrounding `<Card>` layout.

### 4. `app/(public)/get-listed/actions.ts` — assemble + validate

- Read `formData.getAll('day')` → numbers; read the four time fields.
- Call `formatBusinessHours(...)`.
- If it returns `null`, `redirect('/get-listed?error=missing')` (reuse the existing
  "missing" copy, or add a dedicated message if we want hours-specific wording —
  decide during implementation).
- Otherwise set `business_hours` to the formatted string in the insert (replacing
  `str(formData, 'business_hours')` at line 45).
- `lib/submission-guard.ts` is unaffected: `business_hours` is no longer a raw
  submitted field, and the assembled string is short. No change needed there.

## Database

**No migration.** `business_hours` remains `text`. This change only affects how new
submissions are formatted; existing rows and all display code are untouched.

## Testing

The project currently has **no test runner** (no `test` script, no vitest/jest, no
existing test files). `formatBusinessHours` is a pure function with real edge cases
(12am/12pm, Sun-first ordering, non-contiguous days, incomplete-input → null).

**Decision (confirmed at spec review):** add a minimal **vitest** dev setup and
unit-test the formatter. Scope of the test setup:

- Add `vitest` as a devDependency and a `"test": "vitest run"` (plus optionally
  `"test:watch": "vitest"`) script to `package.json`.
- Minimal config (`vitest.config.ts`) only if needed for path aliases (`@/`); the
  formatter has no DOM/React dependency so no jsdom is required.
- Test file `lib/business-hours.test.ts` covering: single day; multiple/non-contiguous
  days; Sun-first ordering regardless of input order; 12am and 12pm; overnight range
  (`9pm–2am`); and the incomplete-input paths (no days, missing start, missing end) →
  `null`.

Manual verification (in addition): run `npm run dev` (local Supabase), submit the
`/get-listed` form with several day/time combinations, and confirm the stored string
in the local DB matches the expected format and that the required-field validation
fires when days or times are missing.
