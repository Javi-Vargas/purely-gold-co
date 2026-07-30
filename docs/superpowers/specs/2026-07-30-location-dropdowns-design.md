# Dependent state → city dropdowns on the get-listed form

**Date:** 2026-07-30
**Status:** Approved, ready for implementation
**Supersedes:** the untracked `2026-07-19-location-dropdowns-design.md` draft. This
version changes the city escape hatch (checkbox + text box instead of an `Other…`
dropdown option) and the state display (2-letter abbreviation instead of full name).

## Problem

`city` and `state` on the get-listed form are free-text inputs. Applicants type
whatever they like, so the same place arrives as `FL`, `Florida`, `florida`, and
`fl`. That fragmentation makes a directory location filter impossible — the filter
would list one state several times and split its listings across those entries.

The existing rows already show the problem: as of this work the table holds a small
number of listings storing non-canonical states (`Florida`, `Texas`, `test`), and
one is live in the public directory. Fixing it at the source is cheapest now, while
there are a handful of rows to reconcile rather than hundreds. That window closes as
real listings arrive.

## Goal

Replace both free-text inputs with dependent dropdowns: pick a state, and only that
state's cities populate the city dropdown. Store canonical values so a future
directory filter can group listings reliably.

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Field order | State first (left), city second (right) | State drives the city list; you pick it first, left-to-right. |
| State option display | **2-letter abbreviation only** (`FL`) | Applicant's explicit preference. Compact. Value stored is the code. |
| State accessibility | Best-effort `aria-label` with the full name (`Florida`) on each option | Screen-reader support for `aria-label` on `<option>` is inconsistent across browsers/AT, so this is a best-effort enhancement, not a guarantee. Documented tradeoff of choosing abbreviation-only display. |
| City coverage | ~40 major cities per state, plus a checkbox escape hatch | A fixed list with no escape hatch locks out small-town businesses; they'd pick the nearest big city (corrupting location data) or abandon the form. |
| City escape hatch | **"My city is not listed" checkbox** below the dropdowns; checking it disables the city dropdown and enables a free-text box | Applicant's preferred UX. Disabling the dropdown (rather than removing it) means exactly one `city` field submits — see the LocationFields note. |
| List sizing | Top ~40 *per state*, not a national population cutoff | A flat cutoff leaves rural states with 1–2 cities, forcing the escape hatch every time and defeating the feature. |
| Where the data lives | Bundled TypeScript module in the repo | City names don't change. A runtime API adds latency and a failure mode to the only intake path for freshness that is worthless here. |
| Stored state value | Two-letter code (`TX`) | Conventional in US addresses, compact on cards, which already render `[city, state]` → "Austin, TX" with no display changes. |
| Stored city value | Plain name (`Austin`) | Already the display value; nothing to normalize. |
| Required fields | State required, city optional | State drives the filter, so it must be reliably present. Requiring city adds friction for freelancers who work across a region. |

### Considered and rejected

- **Every US place (~19,500).** A 1,200-item dropdown for Texas is unusable without
  a typeahead, for negligible gain.
- **Typeahead combobox over the full dataset.** Best UX at scale, but a custom
  component with keyboard/accessibility work — unjustified at this listing volume.
- **Cities in a Supabase table.** Storage is free either way; it only earns its keep
  if the list is curated from the admin panel without a redeploy, which is
  speculative today.
- **External geo API.** Adds a third-party dependency to the entire applicant
  pipeline; if it throttles or changes shape, the city dropdown silently empties.
- **`Other…` option inside the city dropdown.** The previous draft's approach;
  replaced by the checkbox per applicant preference.

## Architecture

### 1. `lib/us-locations.ts` (new)

Static data module. No imports, no side effects, safe in both server and client
components.

```ts
export interface UsState { code: string; name: string }
export const US_STATES: UsState[]                    // 51 — 50 states + DC
export const CITIES_BY_STATE: Record<string, string[]>
export function citiesForState(code: string | null | undefined): string[]
export function stateLabel(code: string | null | undefined): string
export function isValidStateCode(value: string): boolean
```

- `US_STATES` sorted alphabetically **by code** (matches the abbreviation-only
  display order: `AK, AL, AR, AZ, CA, …`). Each entry carries both `code` and `name`
  so the component can show the code and set `aria-label` to the name. DC included as
  `{ code: 'DC', name: 'District of Columbia' }`.
- `CITIES_BY_STATE` keyed by code, each list sorted alphabetically, no duplicates.
- `citiesForState` returns `[]` for unknown or empty input, so the caller never needs
  a null check.
- `stateLabel` returns the input unchanged when it is not a known code, mirroring how
  `serviceTypeLabel` in `lib/utils.ts` degrades — this matters for any pre-existing
  row storing `"Florida"` if not backfilled.
- `isValidStateCode` is the whitelist the guard uses.

Estimated size: ~2,000 city names, ~50 kB raw, ~15 kB gzipped.

### 2. `scripts/generate-us-locations.mjs` (new)

Generates the module above so the data is reproducible rather than hand-typed
(2,000 hand-written names would contain errors, and a wrong city is worse than a
missing one).

- **Source:** the US Census Bureau Population Estimates flat file
  `https://www2.census.gov/programs-surveys/popest/datasets/2020-2024/cities/totals/sub-est2024.csv`
  — public domain, no attribution, **no API key**. (Per the prior draft: verified
  reachable 2026-07-19, HTTP 200, ~7 MB, 19,479 rows at `SUMLEV=162`. Re-verify
  reachability at implementation time; if the URL has moved, find the current
  `sub-est` places file on the Census site rather than substituting a keyed API.)
- **Rejected sources:** `api.census.gov` requires a registered key; SimpleMaps blocks
  automated download and requires attribution; plotly's `us-cities-top-1k` covers
  only 1,000 cities nationally, reintroducing the rural-state gap.
- **Method:** filter to `SUMLEV=162` (incorporated places), group by `STNAME`, rank
  by `POPESTIMATE2024`, take the top 40 per state, sort alphabetically, emit as
  TypeScript.
- **Name normalization:** the `NAME` column carries a legal suffix (`Abbeville city`,
  `Addison town`, `Kohler village`). Strip only a trailing type word, so
  `Oklahoma City city` → `Oklahoma City`, not `Oklahoma`. Verify against known
  multi-word cases before accepting output.
- Plain `.mjs`, runnable with bare `node`, no new dependencies.
- The generated file carries a header comment recording source URL, generation date,
  and method.

The script is committed for provenance. It is a one-off — nothing in the build or
deploy pipeline runs it.

### 3. `components/get-listed/LocationFields.tsx` (new)

The get-listed page is a Server Component using a server action and stays that way.
Dependent dropdowns need client state, so only the location fields become a
`'use client'` island. Everything else on the page (including the merged
BusinessHoursPicker) is untouched.

Client state:
- `state: string` — selected state code (`''` until chosen).
- `city: string` — selected city from the dropdown.
- `notListed: boolean` — whether the "My city is not listed" checkbox is checked.
- `customCity: string` — text typed into the escape-hatch box.

Rendered controls:
- **State select** — `name="state"`, required, always enabled, options from
  `US_STATES` showing `code` as text with `aria-label={name}`, value = `code`.
- **City select** — `name="city"`, options from `citiesForState(state)` plus a
  disabled `Select…` placeholder. **`disabled` when no state is selected OR when
  `notListed` is true.** Only the *city* select is ever disabled by the checkbox;
  the state select stays enabled so the applicant can still change states.
- **"My city is not listed" checkbox** — UI-only control (not submitted). Toggling it
  flips `notListed`.
- **City text input** — `name="city"`, `disabled` unless `notListed` is true;
  greyed-out placeholder styling when disabled.

Behavior rules:
- **Reset city when the state changes.** Selecting Austin then switching to
  California must clear the stored city, or the form submits Austin/CA. Clear both
  `city` and `customCity` on state change.
- **Exactly one `city` field submits.** Both the city select and the text input use
  `name="city"`, but **disabled form controls are not submitted**, and exactly one of
  the two is enabled at any time (select when `notListed` is false, text input when
  `notListed` is true). So `formData.get('city')` always reflects the active control —
  no double-submit, no silently dropped value.
- City remains optional: a blank dropdown or a blank text box is allowed.

Styling reuses the existing `Select`, `Input`, and `Label` primitives from
`components/ui/Input.tsx`, so the fields match the rest of the form.

### 4. `lib/submission-guard.ts` (modified)

The form control guarantees nothing — server actions accept arbitrary `FormData`,
and this action is reachable by anything that can POST.

- Reject when `state` is missing (required now).
- Reject when `state` is not in the `isValidStateCode` whitelist.
- City keeps its existing 80-character cap. It cannot be whitelisted, because the
  escape-hatch text box accepts free text by design.

Both rejections return the existing `'invalid'` error code, which
`app/(public)/get-listed/page.tsx` already maps to a friendly message. No new error
plumbing.

### 5. `app/(public)/get-listed/page.tsx` (modified)

Replace the current free-text city/state block (the `<Input id="city">` and
`<Input id="state">` grid, around lines 108–117) with `<LocationFields />`. No
change to the action's insert: it already reads `city`/`state` from `formData`.

### 6. Data backfill (one row, separate approval)

An existing listing stores `state: "Florida"`. After this ships, that value is not a
valid code and will not match a code-based filter.

```sql
update golden_pages_profiles set state = 'FL' where state = 'Florida';
```

This is a write to the live **production** database, so it is presented for explicit
approval rather than bundled into the change. It is not urgent: the row is `pending`
and not publicly visible. (Run against production only after the applicant approves;
follow the live-DB safety practice of selecting the affected rows first.)

## Data flow

```
US_STATES ──────────────┐
                        ├──> LocationFields (client island)
CITIES_BY_STATE ────────┘         │
                                  │ state="TX", city="Austin"  (or custom text)
                                  ▼
                      <form action={submitListing}>
                                  │
                                  ▼
                    guardSubmission()  ── rejects missing/invalid state
                                  │
                                  ▼
                    insert golden_pages_profiles (city, state unchanged columns)
                                  │
                                  ▼
                 cards render [city, state] → "Austin, TX"
```

## Error handling

| Case | Behavior |
|---|---|
| No state selected | Native `required` blocks submit; server rejects as a backstop |
| Forged / unknown state value | `guardSubmission` returns `'invalid'`; existing friendly message |
| State with no cities in the dataset | `citiesForState` returns `[]`; city select shows only the placeholder; applicant uses the checkbox |
| Checkbox checked, city text left blank | Allowed — city is optional |
| City text exceeds 80 chars | Existing length cap returns `'invalid'` |
| JavaScript disabled | State select still submits; the city select can't filter, so it renders disabled. Accepted — the rest of the form already depends on React. |

## Testing

- **vitest** (already set up) for the pure helpers in `lib/us-locations.ts`:
  `citiesForState` returns `[]` for unknown/empty and the right list for a known
  code; `isValidStateCode` accepts real codes and rejects junk/lowercase-as-needed;
  `stateLabel` returns the name for a code and degrades (returns input) for unknown.
- **Generated-data assertions** (in the same test file): 51 states present, every
  state has ≥1 city, no duplicate cities within a state, no empty strings.
- **Manual pass on `/get-listed`:** select Texas → Texas cities appear; switch to
  California → city resets and California cities appear; check "My city is not listed"
  → the city dropdown greys out (state stays active) and the text box becomes
  typeable; submit → row lands with `state='TX'`; confirm exactly one field named
  `city` submits in each mode. Test against **local** Supabase.

## Verification

- `npx tsc --noEmit` and `npx eslint .` clean.
- `npm test` green (helpers + data assertions).

## Out of scope

- **The directory location filter.** This work makes it straightforward and should
  follow it, but it is a separate change (confirmed out of scope).
- **A city-based filter.** City is optional and includes free text, so it cannot
  filter reliably.
- **Backfilling more than the single `"Florida"` row**, unless others turn out to
  store non-canonical states at implementation time.
