# Social Media Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let businesses submit optional Instagram/TikTok/YouTube/Facebook links on `/get-listed`, store them, and display them on the public profile, directory, and admin surfaces — and make the existing website field required.

**Architecture:** A single pure data module (`lib/social-links.ts`) defines the 4 platforms once; the form, the submission guard, and the server action consume its keys, and a small icon component (`components/social/SocialIcon.tsx`) renders them on display surfaces. Storage is four new nullable `text` columns on `golden_pages_profiles` (additive migration, no backfill). Validation reuses the guard's existing `http(s)://` check.

**Tech Stack:** Next.js 16 (App Router, Server Actions), React 19, TypeScript (strict), Tailwind v4, Supabase (Postgres + CLI migrations), lucide-react, Vitest.

## Global Constraints

- **Platforms (fixed set, this exact order):** Instagram, TikTok, YouTube, Facebook. Column keys: `instagram_url`, `tiktok_url`, `youtube_url`, `facebook_url`.
- **Social links are optional; the website field is required.**
- **Input format:** full URLs; validated only as `http(s)://…` (no per-platform domain checks).
- **No DB backfill.** New columns are nullable `text`; existing rows stay `NULL`.
- **Migration is the source of truth.** Apply locally first; the remote `supabase db push --linked` is a human-approved final step (prod has no backup/PITR).
- **`lib/social-links.ts` stays pure data (no JSX/React)** so server modules (guard, action) can import it without pulling in icons. Icons live in `components/social/SocialIcon.tsx`.
- **Reuse** `Input`, `Label` from `@/components/ui/Input`; match existing link markup (`target="_blank" rel="noreferrer"`).
- **Verification tooling:** `npx tsc --noEmit` and `npm run lint` clean; `npm test` (vitest) green.
- **Branch:** `social-links` (already checked out).

---

### Task 1: Pure data module — `lib/social-links.ts`

**Files:**
- Create: `lib/social-links.ts`
- Test: `lib/social-links.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type SocialKey = 'instagram_url' | 'tiktok_url' | 'youtube_url' | 'facebook_url'`
  - `interface SocialPlatform { key: SocialKey; label: string; placeholder: string }`
  - `const SOCIAL_PLATFORMS: SocialPlatform[]` — 4 entries in the fixed order
  - `const SOCIAL_KEYS: SocialKey[]` — `SOCIAL_PLATFORMS.map(p => p.key)`

- [ ] **Step 1: Write the failing test**

Create `lib/social-links.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { SOCIAL_PLATFORMS, SOCIAL_KEYS } from './social-links'

describe('SOCIAL_PLATFORMS', () => {
  it('lists the 4 platforms in the fixed order', () => {
    expect(SOCIAL_PLATFORMS.map((p) => p.label)).toEqual([
      'Instagram',
      'TikTok',
      'YouTube',
      'Facebook',
    ])
  })

  it('uses *_url column keys, all unique', () => {
    const keys = SOCIAL_PLATFORMS.map((p) => p.key)
    expect(keys).toEqual(['instagram_url', 'tiktok_url', 'youtube_url', 'facebook_url'])
    expect(new Set(keys).size).toBe(keys.length)
    for (const k of keys) expect(k.endsWith('_url')).toBe(true)
  })

  it('gives every platform a non-empty placeholder', () => {
    for (const p of SOCIAL_PLATFORMS) expect(p.placeholder.length).toBeGreaterThan(0)
  })

  it('SOCIAL_KEYS mirrors the platform keys', () => {
    expect(SOCIAL_KEYS).toEqual(SOCIAL_PLATFORMS.map((p) => p.key))
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- social-links.test`
Expected: FAIL — cannot resolve `./social-links`.

- [ ] **Step 3: Write the implementation**

Create `lib/social-links.ts`:
```ts
// Single source of truth for the social platforms captured on /get-listed.
// Pure data (no JSX) so server modules (submission guard, server action) can
// import SOCIAL_KEYS without pulling in icon/React code. Icons live in
// components/social/SocialIcon.tsx.

export type SocialKey = 'instagram_url' | 'tiktok_url' | 'youtube_url' | 'facebook_url'

export interface SocialPlatform {
  key: SocialKey
  label: string
  placeholder: string
}

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  { key: 'instagram_url', label: 'Instagram', placeholder: 'https://instagram.com/…' },
  { key: 'tiktok_url', label: 'TikTok', placeholder: 'https://tiktok.com/@…' },
  { key: 'youtube_url', label: 'YouTube', placeholder: 'https://youtube.com/@…' },
  { key: 'facebook_url', label: 'Facebook', placeholder: 'https://facebook.com/…' },
]

export const SOCIAL_KEYS: SocialKey[] = SOCIAL_PLATFORMS.map((p) => p.key)
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- social-links.test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/social-links.ts lib/social-links.test.ts
git commit -m "Add social-links data module (SOCIAL_PLATFORMS, SOCIAL_KEYS)"
```

---

### Task 2: Migration — add the 4 columns (apply locally)

**Files:**
- Create: `supabase/migrations/20260731000000_add_social_link_columns.sql`

**Interfaces:**
- Consumes: nothing.
- Produces: columns `instagram_url`, `tiktok_url`, `youtube_url`, `facebook_url` (nullable `text`) on `public.golden_pages_profiles`.

> The remote push (`supabase db push --linked`) is intentionally NOT in this task — it is the human-approved final Task 9. This task only applies the migration to the **local** dev database.

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/20260731000000_add_social_link_columns.sql`:
```sql
-- Add optional social media link columns to golden_pages_profiles.
-- All nullable text; existing rows default to NULL. Additive, no backfill.
alter table public.golden_pages_profiles
  add column if not exists instagram_url text,
  add column if not exists tiktok_url    text,
  add column if not exists youtube_url   text,
  add column if not exists facebook_url  text;
```

- [ ] **Step 2: Apply to the local database**

Run: `npx supabase migration up`
Expected: applies `20260731000000_add_social_link_columns` with no error. (If the local stack is stopped, run `npx supabase start` first.)

- [ ] **Step 3: Verify the columns exist locally**

Run:
```bash
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "\d public.golden_pages_profiles" | grep -E "instagram_url|tiktok_url|youtube_url|facebook_url"
```
Expected: four rows, each `text` and nullable.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260731000000_add_social_link_columns.sql
git commit -m "Add migration: social link columns on golden_pages_profiles"
```

---

### Task 3: Validation + type (guard + GoldenPagesProfile)

**Files:**
- Modify: `lib/submission-guard.ts` (MAX_LEN + URL-format loop)
- Modify: `types/index.ts:71-90` (add 4 fields to `GoldenPagesProfile`)

**Interfaces:**
- Consumes: `SOCIAL_KEYS` from `@/lib/social-links` (Task 1).
- Produces: guard rejects a non-`http(s)` value in any social field with `{ ok: false, error: 'invalid' }`; `GoldenPagesProfile` gains `instagram_url/tiktok_url/youtube_url/facebook_url: string | null`.

> No guard unit test: `guardSubmission` depends on `next/headers` and the Supabase admin client, and the codebase has no mock harness for it (the location-dropdowns feature validated the same guard path via manual e2e only). The change here is purely additive data fed into the existing validation loop; it is covered by tsc + the Task 8 manual e2e.

- [ ] **Step 1: Add the import and extend MAX_LEN**

In `lib/submission-guard.ts`, add after the existing imports (after the `isValidStateCode` import on line 4):
```ts
import { SOCIAL_KEYS } from '@/lib/social-links'
```

In the `MAX_LEN` object (lines 23-38), the leftover `instagram_url: 200,` entry exists but the other three don't. Replace the `instagram_url: 200,` line with all four at 300 (consistent with `website_url`):
```ts
  instagram_url: 300,
  tiktok_url: 300,
  youtube_url: 300,
  facebook_url: 300,
```

- [ ] **Step 2: Add social keys to the URL-format check**

In `lib/submission-guard.ts`, the existing loop (around lines 96-99) reads:
```ts
  for (const key of ['website_url', 'portfolio_url']) {
    const u = val(formData, key)
    if (u && !/^https?:\/\//i.test(u)) return { ok: false, error: 'invalid' }
  }
```
Change the iterated array to include the social keys:
```ts
  for (const key of ['website_url', 'portfolio_url', ...SOCIAL_KEYS]) {
    const u = val(formData, key)
    if (u && !/^https?:\/\//i.test(u)) return { ok: false, error: 'invalid' }
  }
```

- [ ] **Step 3: Add the fields to the GoldenPagesProfile type**

In `types/index.ts`, in the `GoldenPagesProfile` interface (lines 71-90), add after `website_url: string | null` (line 80):
```ts
  instagram_url: string | null
  tiktok_url: string | null
  youtube_url: string | null
  facebook_url: string | null
```

- [ ] **Step 4: Typecheck, lint, and run the full test suite**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all clean; vitest green (existing suites + Task 1's `social-links.test`).

- [ ] **Step 5: Commit**

```bash
git add lib/submission-guard.ts types/index.ts
git commit -m "Validate social link URLs in guard; add fields to GoldenPagesProfile"
```

---

### Task 4: Capture — form fields + server action

**Files:**
- Modify: `app/(public)/get-listed/page.tsx` (website `required`; 4 social inputs; error copy)
- Modify: `app/(public)/get-listed/actions.ts` (read + insert social fields; website presence check; select projection)

**Interfaces:**
- Consumes: `SOCIAL_PLATFORMS` from `@/lib/social-links` (Task 1).
- Produces: form submits `instagram_url/tiktok_url/youtube_url/facebook_url` (optional) and requires `website_url`; the action stores all four and rejects a missing website with `?error=missing`.

- [ ] **Step 1: Make website required and add the social inputs in the form**

In `app/(public)/get-listed/page.tsx`, add the import after the `LocationFields` import (line 5):
```tsx
import { SOCIAL_PLATFORMS } from '@/lib/social-links'
```

Make the website input required — replace the current website input (line 105):
```tsx
            <Input id="website_url" name="website_url" type="url" placeholder="https://" />
```
with:
```tsx
            <Input id="website_url" name="website_url" type="url" placeholder="https://" required />
```

Then, directly after the website `<div>` block (which currently ends on line 106) and before `<BusinessHoursPicker />` (line 107), insert the social fields:
```tsx
          <div className="grid gap-4 sm:grid-cols-2">
            {SOCIAL_PLATFORMS.map((p) => (
              <div key={p.key}>
                <Label htmlFor={p.key}>{p.label}</Label>
                <Input id={p.key} name={p.key} type="url" placeholder={p.placeholder} />
              </div>
            ))}
          </div>
```

Update the `missing` error copy (line 19-20) to mention website:
```tsx
      ? 'Please fill in business name, contact name, email, website, and business hours.'
```

- [ ] **Step 2: Wire the action — presence check, insert, and select projection**

In `app/(public)/get-listed/actions.ts`:

Add website to the required-field presence check (lines 47-49):
```ts
  if (!business_name || !contact_name || !email || !business_hours || !str(formData, 'website_url')) {
    redirect('/get-listed?error=missing')
  }
```

Add the four social fields to the `.insert({...})` object (after the existing `bio:` line 68):
```ts
      instagram_url: str(formData, 'instagram_url'),
      tiktok_url: str(formData, 'tiktok_url'),
      youtube_url: str(formData, 'youtube_url'),
      facebook_url: str(formData, 'facebook_url'),
```

Extend the `.select(...)` projection (line 72) so the admin email (Task 5) receives the links:
```ts
    .select('id, business_name, service_type, city, state, email, website_url, instagram_url, tiktok_url, youtube_url, facebook_url')
```

- [ ] **Step 3: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: clean. (`str()` already returns `string | null`, matching the new nullable columns.)

- [ ] **Step 4: Commit**

```bash
git add "app/(public)/get-listed/page.tsx" "app/(public)/get-listed/actions.ts"
git commit -m "Capture social links on get-listed form; require website"
```

---

### Task 5: Admin email includes social links

**Files:**
- Modify: `lib/email.ts:32-41` (email `Listing` type) and `:80-90` (notification body)

**Interfaces:**
- Consumes: the `Listing` shape passed from the action's `.select(...)` (Task 4, which now returns the social columns).
- Produces: the admin new-listing email lists any present social links.

- [ ] **Step 1: Extend the email Listing type**

In `lib/email.ts`, add the social keys to the `Listing` `Pick<...>` (after `'website_url'`, line 40):
```ts
  | 'website_url'
  | 'instagram_url'
  | 'tiktok_url'
  | 'youtube_url'
  | 'facebook_url'
```

- [ ] **Step 2: Render present links in the email body**

In `sendAdminNewListingNotification`, add after the Website `<li>` (line 87):
```ts
        ${listing.instagram_url ? `<li><strong>Instagram:</strong> ${esc(listing.instagram_url)}</li>` : ''}
        ${listing.tiktok_url ? `<li><strong>TikTok:</strong> ${esc(listing.tiktok_url)}</li>` : ''}
        ${listing.youtube_url ? `<li><strong>YouTube:</strong> ${esc(listing.youtube_url)}</li>` : ''}
        ${listing.facebook_url ? `<li><strong>Facebook:</strong> ${esc(listing.facebook_url)}</li>` : ''}
```

- [ ] **Step 3: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add lib/email.ts
git commit -m "Include social links in admin new-listing email"
```

---

### Task 6: Icon component — `components/social/SocialIcon.tsx`

**Files:**
- Create: `components/social/SocialIcon.tsx`

**Interfaces:**
- Consumes: `SocialKey` from `@/lib/social-links` (Task 1); `Instagram`, `Youtube`, `Facebook` from `lucide-react`.
- Produces: `function SocialIcon({ platform, size, className }: { platform: SocialKey; size?: number; className?: string }): JSX.Element` — the right glyph per platform, with an inline TikTok SVG (lucide has no TikTok icon).

- [ ] **Step 1: Create the component**

Create `components/social/SocialIcon.tsx`:
```tsx
import { Instagram, Youtube, Facebook } from 'lucide-react'
import type { SocialKey } from '@/lib/social-links'

// lucide-react has no TikTok glyph, so render a compact inline SVG that accepts
// the same size/className props as the lucide icons.
function TikTok({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M16.5 3a5.5 5.5 0 0 0 4.5 4.9v3.02a8.5 8.5 0 0 1-4.5-1.3v6.13a6.25 6.25 0 1 1-6.25-6.25c.3 0 .6.02.88.06v3.1a3.2 3.2 0 1 0 2.24 3.05V3h3.13z" />
    </svg>
  )
}

const ICONS: Record<SocialKey, React.ComponentType<{ size?: number; className?: string }>> = {
  instagram_url: Instagram,
  tiktok_url: TikTok,
  youtube_url: Youtube,
  facebook_url: Facebook,
}

export function SocialIcon({
  platform,
  size,
  className,
}: {
  platform: SocialKey
  size?: number
  className?: string
}) {
  const Icon = ICONS[platform]
  return <Icon size={size} className={className} />
}
```

- [ ] **Step 2: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: clean (component compiles; not yet imported).

- [ ] **Step 3: Commit**

```bash
git add components/social/SocialIcon.tsx
git commit -m "Add SocialIcon component (lucide + inline TikTok)"
```

---

### Task 7: Display — public profile page

**Files:**
- Modify: `app/(public)/golden-pages/[id]/page.tsx` (imports + social row)

**Interfaces:**
- Consumes: `SOCIAL_PLATFORMS` from `@/lib/social-links`; `SocialIcon` from `@/components/social/SocialIcon`. The page's `.select('*')` already returns the new columns.
- Produces: a row of icon links for whichever social fields are present.

- [ ] **Step 1: Add imports**

In `app/(public)/golden-pages/[id]/page.tsx`, add after the lucide import (line 6):
```tsx
import { SOCIAL_PLATFORMS } from '@/lib/social-links'
import { SocialIcon } from '@/components/social/SocialIcon'
```

- [ ] **Step 2: Render the social row inside the details Card**

In the same file, add after the `business_hours` block that closes on line 72 (still inside the `<Card>` that ends on line 73):
```tsx
        {SOCIAL_PLATFORMS.some((p) => listing[p.key]) && (
          <div className="flex items-center gap-4 pt-1">
            {SOCIAL_PLATFORMS.filter((p) => listing[p.key]).map((p) => (
              <a
                key={p.key}
                href={listing[p.key] as string}
                target="_blank"
                rel="noreferrer"
                aria-label={p.label}
                className="text-gold hover:text-cream"
              >
                <SocialIcon platform={p.key} size={20} />
              </a>
            ))}
          </div>
        )}
```

- [ ] **Step 3: Typecheck, lint, and build-check the route**

Run: `npx tsc --noEmit && npm run lint`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add "app/(public)/golden-pages/[id]/page.tsx"
git commit -m "Show social links on public profile page"
```

---

### Task 8: Display — directory listings + admin detail

**Files:**
- Modify: `components/golden-pages/DirectoryListings.tsx` (type + icon row)
- Modify: `app/(public)/golden-pages/page.tsx:15-16` (select projection)
- Modify: `app/(admin)/admin/golden-pages/[id]/page.tsx:70` (Field rows)

**Interfaces:**
- Consumes: `SOCIAL_PLATFORMS`, `SocialIcon`, and the `SocialKey`s from Tasks 1/6.
- Produces: directory cards and the admin detail page show the social links.

- [ ] **Step 1: Extend the DirectoryListing column type and parent select**

In `components/golden-pages/DirectoryListings.tsx`, add the four keys to the `Pick<...>` union (after `'business_hours'`, line 23):
```ts
  | 'business_hours'
  | 'instagram_url'
  | 'tiktok_url'
  | 'youtube_url'
  | 'facebook_url'
```

In `app/(public)/golden-pages/page.tsx`, extend the `.select(...)` string (line 16) to include the new columns:
```ts
      'id, business_name, service_type, city, state, bio, phone, website_url, business_hours, instagram_url, tiktok_url, youtube_url, facebook_url',
```

- [ ] **Step 2: Add imports and render an icon row in the directory card**

In `components/golden-pages/DirectoryListings.tsx`, add after the lucide import (line 10):
```tsx
import { SOCIAL_PLATFORMS } from '@/lib/social-links'
import { SocialIcon } from '@/components/social/SocialIcon'
```

In the same file, inside the metadata row `<div>` that closes on line 163 (the `flex flex-wrap gap-x-6 gap-y-2` block), add after the `business_hours` span (line 162):
```tsx
                  {SOCIAL_PLATFORMS.filter((p) => l[p.key]).map((p) => (
                    <a
                      key={p.key}
                      href={l[p.key] as string}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={p.label}
                      className="flex items-center gap-2 hover:text-gold"
                    >
                      <SocialIcon platform={p.key} size={14} />
                    </a>
                  ))}
```

- [ ] **Step 3: Add Field rows to the admin detail page**

In `app/(admin)/admin/golden-pages/[id]/page.tsx`, add after the Website `<Field>` (line 70):
```tsx
          <Field label="Instagram" value={listing.instagram_url} />
          <Field label="TikTok" value={listing.tiktok_url} />
          <Field label="YouTube" value={listing.youtube_url} />
          <Field label="Facebook" value={listing.facebook_url} />
```

- [ ] **Step 4: Typecheck, lint, and full test suite**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all clean/green.

- [ ] **Step 5: Commit**

```bash
git add components/golden-pages/DirectoryListings.tsx "app/(public)/golden-pages/page.tsx" "app/(admin)/admin/golden-pages/[id]/page.tsx"
git commit -m "Show social links in directory and admin detail"
```

---

### Task 9: Manual e2e + remote migration push (human-approved)

**Files:** none (verification + deploy step).

> This task is performed by the human/controller against the running app and the live database. A subagent cannot drive a browser or approve a production write.

- [ ] **Step 1: Manual end-to-end verification (local)**

With the dev server on `:3000` (`.env.local` → local Supabase):
1. On `/get-listed`, fill required fields, leave **website blank**, submit → redirected with `?error=missing`.
2. Fill website with a non-URL value like `instagram.com/x` (no scheme) in a social field → `?error=invalid`.
3. Submit a complete form with website + Instagram + TikTok URLs → lands on `/get-listed/thanks`; confirm the stored row has the correct `website_url`, `instagram_url`, `tiktok_url`, and `NULL` for the two omitted platforms.
4. Approve/visit the listing → the public profile page and directory card show the Instagram + TikTok icon links (TikTok renders the inline SVG); admin detail shows all four Field rows; the admin email lists the two present links.

- [ ] **Step 2: Push the migration to production (requires explicit approval)**

> Confirm with the user before running — this mutates the live database, which has no backup/PITR.

Run: `npx supabase db push --linked`
Expected: applies `20260731000000_add_social_link_columns` to remote; `npx supabase migration list --linked` then shows local and remote in sync.

- [ ] **Step 3: Verify the columns on production**

Run:
```bash
npx supabase db query --linked "SELECT column_name FROM information_schema.columns WHERE table_name='golden_pages_profiles' AND column_name IN ('instagram_url','tiktok_url','youtube_url','facebook_url') ORDER BY column_name;"
```
Expected: all four rows returned.

---

## Self-Review

**Spec coverage:**
- Data model (4 nullable text columns, additive, no backfill) → Task 2 + Task 9 push.
- Shared module (single source of truth, pure data) → Task 1; icons split into Task 6 (per Global Constraints).
- Capture: form fields + website required + action insert + guard validation → Tasks 3 (guard/type) + 4 (form/action).
- Display: public profile → Task 7; directory → Task 8; admin detail → Task 8; admin email → Task 5.
- Error handling: missing website → `?error=missing` (Task 4); malformed URL → `?error=invalid` (Task 3); empty social omitted (all `${cond ? … : ''}` / `.filter`) → Tasks 5, 7, 8.
- Testing: unit for data module → Task 1; guard/e2e → Task 3 note + Task 9; tsc/lint/test gates in every task.
- Out of scope items (handles, per-platform validation, owner editing, extra platforms) → not built.
**All covered.**

**Placeholder scan:** no TBD/TODO; all code steps show concrete code. The only deliberate omission (no guard unit test) is justified inline in Task 3 with the codebase precedent.

**Type consistency:** `SocialKey`, `SocialPlatform`, `SOCIAL_PLATFORMS`, `SOCIAL_KEYS` names identical across Tasks 1, 3, 4, 6, 7, 8. Column keys `instagram_url/tiktok_url/youtube_url/facebook_url` consistent across migration (Task 2), type (Task 3), action (Task 4), email (Task 5), and display (Tasks 7, 8). `SocialIcon` prop shape (`platform`, `size`, `className`) consistent between Task 6 definition and Tasks 7/8 usage.
