# Social Media Links on Listings — Design

**Goal:** Let businesses submit social media links (Instagram, TikTok, YouTube, Facebook) on `/get-listed`, store them, and display them on the public profile page and admin surfaces. As part of this change, make the existing **website** field required.

**Branch:** `social-links`

## Scope

- **Platforms (fixed set of 4):** Instagram, TikTok, YouTube, Facebook.
- **Input format:** full URLs (e.g. `https://instagram.com/name`), identical to the existing `website_url` field.
- **Optionality:** each of the 4 social links is **optional** (a business may have none, some, or all). The **website field becomes required**.
- **Display (full scope):** public profile page, directory listings, admin detail page, and the admin new-listing email.

## Data model

Additive, backward-compatible migration on `public.golden_pages_profiles`:

- Add four **nullable** `text` columns: `instagram_url`, `tiktok_url`, `youtube_url`, `facebook_url`.
- No backfill — existing rows get `NULL`.
- No RLS/policy, index, or enum changes (these columns are stored/displayed, never filtered or queried).
- Delivered as a new file in `supabase/migrations/` and applied with `supabase db push --linked`, keeping local and remote migration history in sync (currently 5 migrations; this is the 6th).

## Shared module — `lib/social-links.ts`

Single source of truth for the platform set, consumed by the form, the guard, and all display surfaces so the list of platforms is defined exactly once.

```ts
export interface SocialPlatform {
  key: 'instagram_url' | 'tiktok_url' | 'youtube_url' | 'facebook_url'
  label: string
  placeholder: string
  Icon: ComponentType<{ size?: number; className?: string }>
}

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  { key: 'instagram_url', label: 'Instagram', placeholder: 'https://instagram.com/…', Icon: Instagram },
  { key: 'tiktok_url',    label: 'TikTok',    placeholder: 'https://tiktok.com/@…',   Icon: TikTokIcon },
  { key: 'youtube_url',   label: 'YouTube',   placeholder: 'https://youtube.com/@…',  Icon: Youtube },
  { key: 'facebook_url',  label: 'Facebook',  placeholder: 'https://facebook.com/…',  Icon: Facebook },
]

export const SOCIAL_KEYS = SOCIAL_PLATFORMS.map((p) => p.key) // for guard/action iteration
```

- Icons: `Instagram`, `Youtube`, `Facebook` from `lucide-react`. **`lucide-react` has no TikTok icon**, so `TikTokIcon` is a small inline SVG component (self-contained, same `size`/`className` props as the lucide icons).

## Capture + validation

- **Form** (`app/(public)/get-listed/page.tsx`):
  - Render 4 `type="url"` inputs by mapping over `SOCIAL_PLATFORMS`, placed in the contact `Card` directly under the Website field.
  - Add `required` to the existing Website input.
- **Action** (`app/(public)/get-listed/actions.ts`):
  - Read the 4 social keys and include them in the insert.
  - Add `website_url` to the presence check (`!business_name || !contact_name || !email || !business_hours || !website_url` → `redirect('/get-listed?error=missing')`).
  - Add the 4 social columns to the `insert().select(...)` projection so the admin email can include them.
- **Guard** (`lib/submission-guard.ts`):
  - Add the 4 social keys to `MAX_LEN` (300, same as `website_url`).
  - Add the 4 social keys to the existing `http(s)://` URL-format check loop (currently `['website_url', 'portfolio_url']`). A malformed social URL → `{ ok: false, error: 'invalid' }` → `?error=invalid`, exactly like `website_url`.

## Display

All surfaces render only the links that are present (each wrapped in a truthiness check), mapping over `SOCIAL_PLATFORMS`.

- **Public profile** (`app/(public)/golden-pages/[id]/page.tsx`): a row of icon links beneath the existing website line. `.select('*')` already returns the new columns. Links use `target="_blank" rel="noreferrer"`, matching the website link.
- **Directory listings** (`components/golden-pages/DirectoryListings.tsx`): add the 4 keys to the selected-column union type; render present links as a compact icon row.
- **Admin detail** (`app/(admin)/admin/golden-pages/[id]/page.tsx`): 4 `<Field label=… value=…>` rows (one per platform), matching the existing Website field.
- **Admin new-listing email** (`lib/email.ts`): add the 4 keys to the email data type and list any present links in the notification body (mirroring the existing Website line).

## Error handling

- Missing website → `?error=missing`; the copy for `missing` is updated to mention website alongside business name, contact name, email, and business hours.
- Malformed URL in website or any social field → `?error=invalid` (unchanged mechanism; the guard's format loop now covers social keys too).
- Empty social fields are simply omitted from storage and display — never an error.

## Testing

- **Unit — `lib/social-links.test.ts`:** `SOCIAL_PLATFORMS` has 4 entries with unique keys; every `key` ends in `_url`; `SOCIAL_KEYS` matches the platform keys.
- **Unit — guard:** a submission with a non-`http(s)` social value is rejected with `error: 'invalid'`; a submission missing `website_url` is caught by the action's presence check (covered where guard/action logic is unit-testable).
- **Manual e2e (browser, human):** submit with a couple of social links → confirm stored, rendered on the public profile + admin detail, and included in the admin email; submit with website blank → `?error=missing`; submit a social value without `http://` → `?error=invalid`.
- `npx tsc --noEmit`, `npm run lint`, `npm test` all clean/green.

## Out of scope

- Handle/username input (URLs only).
- Per-platform URL-shape validation beyond `http(s)://` (e.g. verifying an Instagram URL is really instagram.com).
- Backfilling or editing social links on existing listings via any owner-facing UI (there is none today).
- Additional platforms (X/Twitter, LinkedIn, Vimeo).
