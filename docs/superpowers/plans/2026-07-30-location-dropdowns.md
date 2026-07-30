# Location State/City Dropdowns Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the free-text `city`/`state` inputs on `/get-listed` with a required state dropdown (2-letter codes) and a dependent city dropdown filtered by state, plus a "My city is not listed" checkbox that enables a free-text city box.

**Architecture:** A generated static data module supplies states and per-state cities. A small `'use client'` island (`LocationFields`) renders the dependent dropdowns + checkbox inside the otherwise server-rendered form. The server action's storage is unchanged (still text); `submission-guard.ts` gains state required + whitelist validation.

**Tech Stack:** Next.js 16 (App Router, Server Actions), React 19, TypeScript (strict), Tailwind v4, Vitest, Node (one-off data generator).

## Global Constraints

- **No DB migration.** `city` and `state` stay nullable `text` columns; the action's insert is unchanged. Storage is purely different string *content*.
- **Stored values:** `state` = 2-letter code (`TX`); `city` = plain name (`Austin`) or free text.
- **State field:** required; server-validated against a code whitelist (`isValidStateCode`). **City:** optional.
- **State option display:** show the 2-letter code (`FL`) as option text, with `aria-label` set to the full state name (best-effort a11y; native `<option>` aria support is inconsistent).
- **Checkbox disables ONLY the city dropdown.** The state select stays enabled. Exactly **one** field named `city` may be enabled (and therefore submitted) at any time — disabled controls are not submitted.
- **City data:** ~40 cities per state, from the US Census `sub-est2024` file, `SUMLEV=162` (incorporated places), ranked by `POPESTIMATE2024`, suffix-stripped, sorted alphabetically.
- **Out of scope (do NOT build):** the directory location filter; the legacy `"Florida"→"FL"` production backfill (separate manual approval).
- **Reuse** the `Input`, `Select`, `Label` primitives from `components/ui/Input.tsx`.
- **Verification tooling:** `npx tsc --noEmit` and `npx eslint .` clean; `npm test` (vitest) green.
- **Branch:** `location-dropdowns` (already checked out).

---

### Task 1: Census data generator + generated city data

**Files:**
- Create: `scripts/generate-us-locations.mjs`
- Create (generated): `lib/us-locations-data.ts`
- Test: `lib/us-locations-data.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `export const CITIES_BY_STATE: Record<string, string[]>` in `lib/us-locations-data.ts` — keys are 2-letter state codes (50 states + DC = 51 keys), each value an alphabetically-sorted, duplicate-free list of city names.

> Note: the generator downloads a ~7 MB public Census file over the network. If the URL is unreachable at execution time, report BLOCKED with the HTTP status rather than substituting a keyed API or a smaller dataset.

- [ ] **Step 1: Write the generator script**

Create `scripts/generate-us-locations.mjs`:
```js
// Generates lib/us-locations-data.ts (CITIES_BY_STATE) from the US Census
// Population Estimates sub-est file. One-off; NOT run by the build/deploy.
// Source is public domain, no API key.
import { writeFileSync } from 'node:fs'

const SOURCE_URL =
  'https://www2.census.gov/programs-surveys/popest/datasets/2020-2024/cities/totals/sub-est2024.csv'
const CITIES_PER_STATE = 40
const OUT = new URL('../lib/us-locations-data.ts', import.meta.url)

// Full state/DC name -> 2-letter code. 50 states + DC.
const NAME_TO_CODE = {
  Alabama: 'AL', Alaska: 'AK', Arizona: 'AZ', Arkansas: 'AR', California: 'CA',
  Colorado: 'CO', Connecticut: 'CT', Delaware: 'DE', 'District of Columbia': 'DC',
  Florida: 'FL', Georgia: 'GA', Hawaii: 'HI', Idaho: 'ID', Illinois: 'IL',
  Indiana: 'IN', Iowa: 'IA', Kansas: 'KS', Kentucky: 'KY', Louisiana: 'LA',
  Maine: 'ME', Maryland: 'MD', Massachusetts: 'MA', Michigan: 'MI', Minnesota: 'MN',
  Mississippi: 'MS', Missouri: 'MO', Montana: 'MT', Nebraska: 'NE', Nevada: 'NV',
  'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
  'North Carolina': 'NC', 'North Dakota': 'ND', Ohio: 'OH', Oklahoma: 'OK',
  Oregon: 'OR', Pennsylvania: 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', Tennessee: 'TN', Texas: 'TX', Utah: 'UT', Vermont: 'VT',
  Virginia: 'VA', Washington: 'WA', 'West Virginia': 'WV', Wisconsin: 'WI',
  Wyoming: 'WY',
}

// Trailing place-type words to strip from the Census NAME column.
const TYPE_SUFFIXES = [
  'city', 'town', 'village', 'borough', 'municipality', 'township', 'CDP',
]

function stripSuffix(name) {
  let out = name.trim()
  out = out.replace(/\s*\([^)]*\)\s*$/, '').trim() // drop trailing "(balance)" etc.
  for (const suffix of TYPE_SUFFIXES) {
    const re = new RegExp(`\\s+${suffix}$`, 'i')
    if (re.test(out)) {
      out = out.replace(re, '').trim()
      break
    }
  }
  return out
}

// Minimal CSV line parser handling quoted fields.
function parseLine(line) {
  const fields = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++ } else { inQuotes = false }
      } else cur += ch
    } else {
      if (ch === '"') inQuotes = true
      else if (ch === ',') { fields.push(cur); cur = '' }
      else cur += ch
    }
  }
  fields.push(cur)
  return fields
}

const res = await fetch(SOURCE_URL)
if (!res.ok) throw new Error(`Census fetch failed: HTTP ${res.status} for ${SOURCE_URL}`)
const text = await res.text()
const lines = text.split(/\r?\n/).filter(Boolean)
const header = parseLine(lines[0])
const idx = (name) => {
  const i = header.indexOf(name)
  if (i === -1) throw new Error(`column not found: ${name}`)
  return i
}
const iSumlev = idx('SUMLEV')
const iName = idx('NAME')
const iStname = idx('STNAME')
const iPop = idx('POPESTIMATE2024')

// code -> Map<cityName, pop>, keeping the max pop seen per name.
const byState = {}
for (let r = 1; r < lines.length; r++) {
  const f = parseLine(lines[r])
  if (f[iSumlev] !== '162') continue // incorporated places only
  const code = NAME_TO_CODE[f[iStname]]
  if (!code) continue // skip territories we don't cover
  const city = stripSuffix(f[iName])
  if (!city) continue
  const pop = Number(f[iPop]) || 0
  byState[code] ??= new Map()
  if (pop > (byState[code].get(city) ?? 0)) byState[code].set(city, pop)
}

// Top N per state by pop, then alphabetical for display.
const CITIES_BY_STATE = {}
for (const code of Object.values(NAME_TO_CODE)) {
  const m = byState[code]
  CITIES_BY_STATE[code] = m
    ? [...m.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, CITIES_PER_STATE)
        .map(([name]) => name)
        .sort((a, b) => a.localeCompare(b))
    : []
}

const banner = `// GENERATED by scripts/generate-us-locations.mjs — do not edit by hand.
// Source: ${SOURCE_URL}
// Generated: ${new Date().toISOString().slice(0, 10)}
// Method: Census sub-est SUMLEV=162, top ${CITIES_PER_STATE} places per state by
// POPESTIMATE2024, suffix-stripped, sorted alphabetically.
`
const body = `export const CITIES_BY_STATE: Record<string, string[]> = ${JSON.stringify(
  CITIES_BY_STATE,
  null,
  2,
)}\n`

writeFileSync(OUT, banner + '\n' + body)
console.log(`wrote ${OUT.pathname}: ${Object.keys(CITIES_BY_STATE).length} states`)
```

- [ ] **Step 2: Run the generator**

Run: `node scripts/generate-us-locations.mjs`
Expected: prints `wrote .../lib/us-locations-data.ts: 51 states` and creates the file.
If the fetch fails (non-200), STOP and report BLOCKED with the status.

- [ ] **Step 3: Write the data-integrity test**

Create `lib/us-locations-data.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { CITIES_BY_STATE } from './us-locations-data'

const CODES = Object.keys(CITIES_BY_STATE)

describe('CITIES_BY_STATE', () => {
  it('covers all 51 states (50 + DC)', () => {
    expect(CODES).toHaveLength(51)
    expect(CODES).toContain('DC')
    expect(CODES).toContain('CA')
  })

  it('gives every state at least one city', () => {
    for (const code of CODES) {
      expect(CITIES_BY_STATE[code].length, `${code} has no cities`).toBeGreaterThan(0)
    }
  })

  it('has no duplicate cities within a state', () => {
    for (const code of CODES) {
      const list = CITIES_BY_STATE[code]
      expect(new Set(list).size, `${code} has duplicates`).toBe(list.length)
    }
  })

  it('has no empty or untrimmed city names', () => {
    for (const code of CODES) {
      for (const city of CITIES_BY_STATE[code]) {
        expect(city).toBe(city.trim())
        expect(city.length).toBeGreaterThan(0)
      }
    }
  })

  it('sorts each state list alphabetically', () => {
    for (const code of CODES) {
      const list = CITIES_BY_STATE[code]
      const sorted = [...list].sort((a, b) => a.localeCompare(b))
      expect(list).toEqual(sorted)
    }
  })

  it('strips place-type suffixes (spot check California)', () => {
    // "... city" suffixes must be gone; multi-word names preserved.
    expect(CITIES_BY_STATE.CA).toContain('Los Angeles')
    expect(CITIES_BY_STATE.CA.some((c) => / city$/i.test(c))).toBe(false)
  })
})
```

- [ ] **Step 4: Run the test**

Run: `npm test -- us-locations-data`
Expected: PASS (all assertions green).

- [ ] **Step 5: Commit**

```bash
git add scripts/generate-us-locations.mjs lib/us-locations-data.ts lib/us-locations-data.test.ts
git commit -m "Add US Census city-data generator and generated city data"
```

---

### Task 2: `us-locations.ts` helpers + US_STATES

**Files:**
- Create: `lib/us-locations.ts`
- Test: `lib/us-locations.test.ts`

**Interfaces:**
- Consumes: `CITIES_BY_STATE` from `./us-locations-data` (Task 1).
- Produces:
  - `interface UsState { code: string; name: string }`
  - `const US_STATES: UsState[]` — 51 entries, sorted by code
  - `const CITIES_BY_STATE` (re-exported)
  - `function citiesForState(code: string | null | undefined): string[]` — `[]` for unknown/empty
  - `function stateLabel(code: string | null | undefined): string` — full name for a code, the input unchanged if unknown, `''` for empty
  - `function isValidStateCode(value: string): boolean`

- [ ] **Step 1: Write the failing test**

Create `lib/us-locations.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import {
  US_STATES,
  citiesForState,
  stateLabel,
  isValidStateCode,
} from './us-locations'

describe('US_STATES', () => {
  it('lists 51 states (50 + DC), sorted by code', () => {
    expect(US_STATES).toHaveLength(51)
    const codes = US_STATES.map((s) => s.code)
    expect(codes).toContain('DC')
    expect([...codes]).toEqual([...codes].sort())
  })
})

describe('citiesForState', () => {
  it('returns a non-empty list for a real state', () => {
    expect(citiesForState('CA').length).toBeGreaterThan(0)
  })
  it('returns [] for unknown, empty, null, or undefined', () => {
    expect(citiesForState('ZZ')).toEqual([])
    expect(citiesForState('')).toEqual([])
    expect(citiesForState(null)).toEqual([])
    expect(citiesForState(undefined)).toEqual([])
  })
})

describe('stateLabel', () => {
  it('returns the full name for a known code', () => {
    expect(stateLabel('FL')).toBe('Florida')
  })
  it('returns the input unchanged for an unknown value', () => {
    expect(stateLabel('Florida')).toBe('Florida')
  })
  it('returns empty string for empty/null/undefined', () => {
    expect(stateLabel('')).toBe('')
    expect(stateLabel(null)).toBe('')
    expect(stateLabel(undefined)).toBe('')
  })
})

describe('isValidStateCode', () => {
  it('accepts real codes and rejects junk', () => {
    expect(isValidStateCode('TX')).toBe(true)
    expect(isValidStateCode('DC')).toBe(true)
    expect(isValidStateCode('tx')).toBe(false)
    expect(isValidStateCode('ZZ')).toBe(false)
    expect(isValidStateCode('')).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- us-locations.test`
Expected: FAIL — cannot resolve `./us-locations`.

- [ ] **Step 3: Write the implementation**

Create `lib/us-locations.ts`:
```ts
import { CITIES_BY_STATE } from './us-locations-data'

export interface UsState {
  code: string
  name: string
}

// 50 states + DC, sorted by 2-letter code (matches the abbreviation display order).
export const US_STATES: UsState[] = [
  { code: 'AK', name: 'Alaska' },
  { code: 'AL', name: 'Alabama' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DC', name: 'District of Columbia' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'IA', name: 'Iowa' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MD', name: 'Maryland' },
  { code: 'ME', name: 'Maine' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MT', name: 'Montana' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NY', name: 'New York' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VA', name: 'Virginia' },
  { code: 'VT', name: 'Vermont' },
  { code: 'WA', name: 'Washington' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WY', name: 'Wyoming' },
]

const STATE_BY_CODE: Record<string, UsState> = Object.fromEntries(
  US_STATES.map((s) => [s.code, s]),
)

export { CITIES_BY_STATE }

// Cities for a state code; [] for unknown/empty so callers need no null check.
export function citiesForState(code: string | null | undefined): string[] {
  if (!code) return []
  return CITIES_BY_STATE[code] ?? []
}

// Full name for a code; the input unchanged if not a known code (degrades like
// serviceTypeLabel); '' for empty input.
export function stateLabel(code: string | null | undefined): string {
  if (!code) return ''
  return STATE_BY_CODE[code]?.name ?? code
}

export function isValidStateCode(value: string): boolean {
  return value in STATE_BY_CODE
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- us-locations.test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/us-locations.ts lib/us-locations.test.ts
git commit -m "Add us-locations helpers (US_STATES, citiesForState, stateLabel, isValidStateCode)"
```

---

### Task 3: `LocationFields` client component

**Files:**
- Create: `components/get-listed/LocationFields.tsx`

**Interfaces:**
- Consumes: `Input`, `Label`, `Select` from `@/components/ui/Input`; `US_STATES`, `citiesForState` from `@/lib/us-locations`.
- Produces: `export function LocationFields()` — a client island emitting `name="state"` (2-letter code, required) and `name="city"` (from either the dropdown or the free-text box; exactly one is enabled at a time).

- [ ] **Step 1: Create the component**

Create `components/get-listed/LocationFields.tsx`:
```tsx
'use client'

import { useState, type ChangeEvent } from 'react'
import { Input, Label, Select } from '@/components/ui/Input'
import { US_STATES, citiesForState } from '@/lib/us-locations'

export function LocationFields() {
  const [state, setState] = useState('')
  const [city, setCity] = useState('')
  const [notListed, setNotListed] = useState(false)
  const [customCity, setCustomCity] = useState('')

  const cities = citiesForState(state)

  function onStateChange(e: ChangeEvent<HTMLSelectElement>) {
    setState(e.target.value)
    setCity('') // reset city when the state changes
    setCustomCity('')
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="state">State</Label>
          <Select id="state" name="state" required value={state} onChange={onStateChange}>
            <option value="" disabled>
              Select…
            </option>
            {US_STATES.map((s) => (
              <option key={s.code} value={s.code} aria-label={s.name}>
                {s.code}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="city">City</Label>
          <Select
            id="city"
            name="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            disabled={!state || notListed}
          >
            <option value="" disabled>
              Select…
            </option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-cream-dim">
          <input
            type="checkbox"
            checked={notListed}
            onChange={(e) => setNotListed(e.target.checked)}
            className="h-4 w-4 accent-gold"
          />
          My city is not listed
        </label>
        <Input
          name="city"
          value={customCity}
          onChange={(e) => setCustomCity(e.target.value)}
          disabled={!notListed}
          placeholder="Enter your city"
          aria-label="City name"
        />
      </div>
    </div>
  )
}
```

**Why this is correct:** both the city `<Select>` and the free-text `<Input>` use `name="city"`, but a **disabled** form control is never submitted. When `notListed` is false the Select is enabled (once a state is chosen) and the Input is disabled; when `notListed` is true the Select is disabled and the Input is enabled. So `formData.get('city')` always reflects the one active control — never two values, never a dropped value.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: PASS (component compiles; not yet imported anywhere).

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no errors for the new file.

- [ ] **Step 4: Commit**

```bash
git add components/get-listed/LocationFields.tsx
git commit -m "Add LocationFields client component (dependent state/city dropdowns)"
```

---

### Task 4: Wire into the form + add state validation

**Files:**
- Modify: `app/(public)/get-listed/page.tsx` (replace the city/state block; add import)
- Modify: `lib/submission-guard.ts` (require + whitelist state)

**Interfaces:**
- Consumes: `LocationFields` (Task 3); `isValidStateCode` (Task 2).
- Produces: end-to-end behavior — the form captures a canonical state code + city, and the server rejects a missing/invalid state.

- [ ] **Step 1: Swap the city/state block for the component in the page**

In `app/(public)/get-listed/page.tsx`, add the import after the existing `BusinessHoursPicker` import (line 4):
```tsx
import { LocationFields } from '@/components/get-listed/LocationFields'
```

Then replace the city/state grid (currently lines 107–116):
```tsx
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input id="state" name="state" />
            </div>
          </div>
```
with:
```tsx
          <LocationFields />
```

- [ ] **Step 2: Add the import to the guard**

In `lib/submission-guard.ts`, add after the existing imports (after the `createAdminClient` import, around line 3):
```ts
import { isValidStateCode } from '@/lib/us-locations'
```

- [ ] **Step 3: Add state required + whitelist validation in the guard**

In `guardSubmission`, immediately after the existing `if (!businessName) return { ok: false, error: 'invalid' }` line (around line 89), add:
```ts
  const state = val(formData, 'state')
  if (!state || !isValidStateCode(state)) return { ok: false, error: 'invalid' }
```
(The `city`/`state` 80-char caps already exist in `MAX_LEN`, so no other guard change is needed. City remains free-text by design.)

- [ ] **Step 4: Typecheck, lint, and test**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all pass; vitest green (Task 1 + Task 2 suites).

- [ ] **Step 5: Manual end-to-end verification (controller/human — needs the running app)**

> A subagent cannot drive a browser; this step is performed by the controller or human against **local** Supabase (dev server on :3000, `.env.local` → local). It is not part of the implementer's automated checks.

1. On `/get-listed`, pick **TX** → the city dropdown enables and shows Texas cities; pick **Austin**.
2. Switch state to **CA** → the city selection resets and California cities appear.
3. Check **"My city is not listed"** → the city dropdown greys out (state stays active), the text box becomes typeable; type a city.
4. Submit a complete form → lands on `/get-listed/thanks`; confirm the stored row has `state='TX'` (or chosen code) and the expected `city`.
5. Submit with no state (replayed POST, bypassing the browser's `required`) → redirected with `?error=invalid` and **no row** created.
6. Confirm exactly one field named `city` submits in each checkbox mode.

- [ ] **Step 6: Commit**

```bash
git add "app/(public)/get-listed/page.tsx" lib/submission-guard.ts
git commit -m "Wire location dropdowns into get-listed form and validate state"
```

---

## Notes for the implementer

- **No display code changes.** Cards render `[city, state].join(', ')` → "Austin, TX" already; the stored code makes that read correctly with no edits.
- **The legacy `"Florida"` row backfill and the directory filter are out of scope** — do not build them.
- `stateLabel` is exported for graceful degradation of legacy values; it is not consumed by this feature's UI yet, but is part of the module's public API and is unit-tested.
- The generated `lib/us-locations-data.ts` is large (~2,000 lines). That is expected — it is produced by the committed generator, not hand-edited.

## Self-Review

**Spec coverage:** state dropdown (codes, required) → Task 3 + guard Task 4; dependent city dropdown disabled until state → Task 3; checkbox disables only city + text box → Task 3; exactly-one-`city` submit → Task 3 (disabled-control mechanism); data module + generator + Census source → Task 1; helpers/whitelist → Task 2; guard require+whitelist → Task 4; no DB migration / storage unchanged → Global Constraints + Task 4 note; aria-label full name on code options → Task 3; testing (helpers + data assertions + manual e2e) → Tasks 1, 2, 4. Directory filter + backfill explicitly out of scope. **All covered.**

**Placeholder scan:** no TBD/TODO; all code blocks complete.

**Type consistency:** `citiesForState`, `stateLabel`, `isValidStateCode`, `US_STATES`, `UsState`, `CITIES_BY_STATE` names are identical across Tasks 1–4; field names `state`/`city` consistent between component (Task 3) and guard/page (Task 4).
