# Business-hours Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the free-text "Business hours" input on `/get-listed` with day bubbles (Sun–Sat) plus From/To hour + AM/PM dropdowns, formatted server-side into a single string stored in the unchanged `business_hours` text column.

**Architecture:** A small `'use client'` picker island renders inside the otherwise server-rendered form and submits structured native fields (`day` ×N, `start_hour`, `start_ampm`, `end_hour`, `end_ampm`). A pure formatter in `lib/business-hours.ts` turns those into `"Mon, Tue, Wed 9am–6pm"`. The `submitListing` server action calls the formatter, enforces the now-required field, and stores the string.

**Tech Stack:** Next.js 16 (App Router, Server Actions), React 19, TypeScript (strict), Tailwind v4, Vitest (new).

## Global Constraints

- **Read before coding:** per `AGENTS.md`, this is a customized Next.js — consult `node_modules/next/dist/docs/` for anything version-specific about client components / server actions before writing code.
- **Stored format (verbatim):** days as a comma-separated list of 3-letter abbreviations in calendar order starting **Sunday**; time lowercase, no space, en-dash `–` (U+2013) between; e.g. `Mon, Tue, Wed, Thu, Fri 9am–6pm`. `12`+AM → `12am`, `12`+PM → `12pm`.
- **Required:** a valid submission needs at least one day AND both a complete From time and a complete To time. Incomplete → `?error=missing`.
- **No DB migration.** `business_hours` stays `text` (nullable). No changes to display code.
- **No start/end ordering check** — overnight ranges (`9pm–2am`) are allowed.
- **Path alias:** `@/*` → repo root. Reuse Tailwind tokens already in the codebase (`gold`, `ink`, `ink-soft`, `line`, `cream`, `cream-dim`).
- **Branch:** work on `business-hours-picker` (already checked out).

---

### Task 1: Vitest + `formatBusinessHours` formatter

**Files:**
- Modify: `package.json` (add devDependency + `test` script)
- Create: `lib/business-hours.ts`
- Test: `lib/business-hours.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type AmPm = 'AM' | 'PM'`
  - `interface BusinessHoursInput { days: number[]; startHour: number | null; startAmPm: AmPm | null; endHour: number | null; endAmPm: AmPm | null }`
  - `function formatBusinessHours(input: BusinessHoursInput): string | null` — returns the formatted string, or `null` when no days are selected or either time is incomplete/out of range.

- [ ] **Step 1: Install vitest and add the test script**

Run:
```bash
npm install -D vitest
```
Then edit `package.json` `scripts` to add (keep existing scripts):
```json
    "lint": "eslint",
    "test": "vitest run"
```
(No `vitest.config.ts` is needed — the test imports the formatter by relative path, so the `@/` alias never has to resolve.)

- [ ] **Step 2: Write the failing test**

Create `lib/business-hours.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { formatBusinessHours } from './business-hours'

describe('formatBusinessHours', () => {
  it('formats a weekday range as a comma list', () => {
    expect(
      formatBusinessHours({ days: [1, 2, 3, 4, 5], startHour: 9, startAmPm: 'AM', endHour: 6, endAmPm: 'PM' }),
    ).toBe('Mon, Tue, Wed, Thu, Fri 9am–6pm')
  })

  it('keeps non-contiguous days as a comma list', () => {
    expect(
      formatBusinessHours({ days: [1, 3, 5], startHour: 9, startAmPm: 'AM', endHour: 6, endAmPm: 'PM' }),
    ).toBe('Mon, Wed, Fri 9am–6pm')
  })

  it('orders days Sunday-first regardless of input order', () => {
    expect(
      formatBusinessHours({ days: [6, 0, 3], startHour: 8, startAmPm: 'AM', endHour: 4, endAmPm: 'PM' }),
    ).toBe('Sun, Wed, Sat 8am–4pm')
  })

  it('dedupes repeated days', () => {
    expect(
      formatBusinessHours({ days: [1, 1, 2], startHour: 9, startAmPm: 'AM', endHour: 5, endAmPm: 'PM' }),
    ).toBe('Mon, Tue 9am–5pm')
  })

  it('formats 12am and 12pm literally', () => {
    expect(
      formatBusinessHours({ days: [0], startHour: 12, startAmPm: 'AM', endHour: 12, endAmPm: 'PM' }),
    ).toBe('Sun 12am–12pm')
  })

  it('allows overnight ranges', () => {
    expect(
      formatBusinessHours({ days: [5], startHour: 9, startAmPm: 'PM', endHour: 2, endAmPm: 'AM' }),
    ).toBe('Fri 9pm–2am')
  })

  it('returns null when no days are selected', () => {
    expect(
      formatBusinessHours({ days: [], startHour: 9, startAmPm: 'AM', endHour: 6, endAmPm: 'PM' }),
    ).toBeNull()
  })

  it('returns null when the start time is incomplete', () => {
    expect(
      formatBusinessHours({ days: [1], startHour: null, startAmPm: 'AM', endHour: 6, endAmPm: 'PM' }),
    ).toBeNull()
  })

  it('returns null when the end time is incomplete', () => {
    expect(
      formatBusinessHours({ days: [1], startHour: 9, startAmPm: 'AM', endHour: 6, endAmPm: null }),
    ).toBeNull()
  })

  it('returns null for an out-of-range hour', () => {
    expect(
      formatBusinessHours({ days: [1], startHour: 0, startAmPm: 'AM', endHour: 6, endAmPm: 'PM' }),
    ).toBeNull()
  })
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `./business-hours` / `formatBusinessHours is not a function`.

- [ ] **Step 4: Implement the formatter**

Create `lib/business-hours.ts`:
```ts
export type AmPm = 'AM' | 'PM'

export interface BusinessHoursInput {
  days: number[] // 0 = Sun … 6 = Sat, any order, may contain dupes
  startHour: number | null
  startAmPm: AmPm | null
  endHour: number | null
  endAmPm: AmPm | null
}

const DAY_ABBRS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

function formatTime(hour: number | null, ampm: AmPm | null): string | null {
  if (hour === null || ampm === null) return null
  if (!Number.isInteger(hour) || hour < 1 || hour > 12) return null
  return `${hour}${ampm.toLowerCase()}`
}

// Builds the stored business-hours string, e.g. "Mon, Tue, Wed 9am–6pm".
// Returns null when the input is incomplete (no days, or either time missing
// / out of range) so the caller can treat it as a validation failure.
export function formatBusinessHours(input: BusinessHoursInput): string | null {
  const days = Array.from(new Set(input.days))
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
    .sort((a, b) => a - b)
  if (days.length === 0) return null

  const start = formatTime(input.startHour, input.startAmPm)
  const end = formatTime(input.endHour, input.endAmPm)
  if (start === null || end === null) return null

  const dayList = days.map((d) => DAY_ABBRS[d]).join(', ')
  return `${dayList} ${start}–${end}`
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test`
Expected: PASS — all 10 tests green.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json lib/business-hours.ts lib/business-hours.test.ts
git commit -m "Add business-hours formatter with vitest tests"
```

---

### Task 2: `BusinessHoursPicker` client component

**Files:**
- Create: `components/get-listed/BusinessHoursPicker.tsx`

**Interfaces:**
- Consumes: `Label`, `Select` from `@/components/ui/Input`; `cn` from `@/lib/utils`.
- Produces: `export function BusinessHoursPicker()` — a client island rendering day bubbles + From/To selects. Emits native form fields: `day` (one hidden input per selected day, value `0`–`6`), `start_hour`/`end_hour` (`1`–`12`), `start_ampm`/`end_ampm` (`AM`/`PM`). Consumed by Task 3.

- [ ] **Step 1: Create the component**

Create `components/get-listed/BusinessHoursPicker.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { Label, Select } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

const DAYS = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
]

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1)

export function BusinessHoursPicker() {
  const [selectedDays, setSelectedDays] = useState<number[]>([])

  function toggleDay(value: number) {
    setSelectedDays((prev) =>
      prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value],
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Business hours</Label>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((day) => {
            const active = selectedDays.includes(day.value)
            return (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleDay(day.value)}
                aria-pressed={active}
                className={cn(
                  'flex h-11 w-11 items-center justify-center rounded-full border text-xs font-medium transition-colors',
                  active
                    ? 'border-gold bg-gold text-ink'
                    : 'border-line bg-ink-soft text-cream-dim hover:border-gold/50',
                )}
              >
                {day.label}
              </button>
            )
          })}
        </div>
        {selectedDays.map((value) => (
          <input key={value} type="hidden" name="day" value={value} />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="start_hour">From</Label>
          <div className="flex gap-2">
            <Select id="start_hour" name="start_hour" defaultValue="" aria-label="Opening hour">
              <option value="" disabled>
                Hour
              </option>
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </Select>
            <Select name="start_ampm" defaultValue="" aria-label="Opening AM or PM">
              <option value="" disabled>
                AM/PM
              </option>
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="end_hour">To</Label>
          <div className="flex gap-2">
            <Select id="end_hour" name="end_hour" defaultValue="" aria-label="Closing hour">
              <option value="" disabled>
                Hour
              </option>
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </Select>
            <Select name="end_ampm" defaultValue="" aria-label="Closing AM or PM">
              <option value="" disabled>
                AM/PM
              </option>
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Typecheck the component**

Run: `npx tsc --noEmit`
Expected: PASS — no type errors. (The component is not yet imported anywhere; this only confirms it compiles.)

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no errors for the new file.

- [ ] **Step 4: Commit**

```bash
git add components/get-listed/BusinessHoursPicker.tsx
git commit -m "Add BusinessHoursPicker client component"
```

---

### Task 3: Wire picker into the form + assemble/validate in the action

**Files:**
- Modify: `app/(public)/get-listed/page.tsx` (replace the business-hours input; update the `missing` error copy)
- Modify: `app/(public)/get-listed/actions.ts` (read structured fields, format, require, store)

**Interfaces:**
- Consumes: `BusinessHoursPicker` (Task 2); `formatBusinessHours`, `AmPm` (Task 1).
- Produces: end-to-end behavior — the form stores a formatted `business_hours` string and rejects incomplete hours with `?error=missing`.

- [ ] **Step 1: Swap the input for the picker in the page**

In `app/(public)/get-listed/page.tsx`, update the import line (line 3) to also import the picker. Change:
```tsx
import { Input, Label, Textarea, Select } from '@/components/ui/Input'
```
to:
```tsx
import { Input, Label, Textarea, Select } from '@/components/ui/Input'
import { BusinessHoursPicker } from '@/components/get-listed/BusinessHoursPicker'
```

Then replace the whole business-hours block (currently lines 105–108):
```tsx
          <div>
            <Label htmlFor="business_hours">Business hours</Label>
            <Input id="business_hours" name="business_hours" placeholder="Mon–Fri 9am–6pm" />
          </div>
```
with:
```tsx
          <BusinessHoursPicker />
```

- [ ] **Step 2: Update the `missing` error copy in the page**

In the same file, update the `error === 'missing'` message (line 17) to mention hours:
```tsx
    error === 'missing'
      ? 'Please fill in business name, contact name, email, and business hours.'
```

- [ ] **Step 3: Import the formatter and add parse helpers in the action**

In `app/(public)/get-listed/actions.ts`, add the import after the existing imports (after line 5):
```ts
import { formatBusinessHours, type AmPm } from '@/lib/business-hours'
```

Add these helpers right after the existing `str` helper (after line 12):
```ts
function hourOrNull(formData: FormData, key: string): number | null {
  const v = formData.get(key)
  if (typeof v !== 'string' || v.trim() === '') return null
  const n = Number(v)
  return Number.isInteger(n) ? n : null
}

function ampmOrNull(formData: FormData, key: string): AmPm | null {
  const v = formData.get(key)
  return v === 'AM' || v === 'PM' ? v : null
}
```

- [ ] **Step 4: Assemble + require business hours in the action**

In `submitListing`, right after the existing `service_type` line (line 24), add:
```ts
  const business_hours = formatBusinessHours({
    days: formData.getAll('day').map((v) => Number(v)),
    startHour: hourOrNull(formData, 'start_hour'),
    startAmPm: ampmOrNull(formData, 'start_ampm'),
    endHour: hourOrNull(formData, 'end_hour'),
    endAmPm: ampmOrNull(formData, 'end_ampm'),
  })
```

Extend the required-field check (currently lines 27–29) to include hours:
```ts
  // Minimal server-side validation (the form also marks these required).
  if (!business_name || !contact_name || !email || !business_hours) {
    redirect('/get-listed?error=missing')
  }
```

- [ ] **Step 5: Store the assembled string in the insert**

In the `.insert({ … })` object, replace the line (currently line 45):
```ts
      business_hours: str(formData, 'business_hours'),
```
with:
```ts
      business_hours,
```
(After the `redirect` above, `business_hours` is narrowed to `string`.)

- [ ] **Step 6: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: PASS — no type or lint errors.

- [ ] **Step 7: Manual end-to-end verification against local Supabase**

Confirm `.env.local` points at local Supabase (`http://127.0.0.1:54321`), then:
```bash
npm run dev
```
In the browser at `/get-listed`:
1. Fill business name, contact name, email. Leave hours empty and submit → redirected back with "Please fill in business name, contact name, email, and business hours."
2. Select `Mon Tue Wed Thu Fri`, From `9 AM`, To `6 PM`, complete the rest, submit → lands on `/get-listed/thanks`.
3. Verify the stored value in the local DB:
```bash
npx supabase db query "select business_name, business_hours from golden_pages_profiles order by created_at desc limit 1"
```
Expected `business_hours`: `Mon, Tue, Wed, Thu, Fri 9am–6pm`.

> Note: this is a **local** query (no `--linked`), so it hits the local test DB, not production.

- [ ] **Step 8: Commit**

```bash
git add "app/(public)/get-listed/page.tsx" "app/(public)/get-listed/actions.ts"
git commit -m "Wire business-hours picker into get-listed form and action"
```

---

## Notes for the implementer

- The `business_hours` column and all display code (`golden-pages/[id]`, admin detail, `DirectoryListings`) are unchanged — they render the string as-is.
- `lib/submission-guard.ts` needs no change: `business_hours` is no longer a raw submitted field, and the assembled string stays well under the 120-char cap. The individual `day`/`*_hour`/`*_ampm` fields are not in `MAX_LEN`, so the guard ignores them.
- Existing rows with legacy free-form hours are untouched.
