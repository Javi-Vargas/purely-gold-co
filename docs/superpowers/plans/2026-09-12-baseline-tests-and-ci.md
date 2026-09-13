# Baseline Tests + CI Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add unit tests for the abuse guard and admin auth, then gate every change to `main` behind a local pre-push hook and required GitHub Actions CI.

**Architecture:** Vitest is already configured and green (33 pure-helper tests). We add an `@`-alias so tests can import the guard/auth modules, mock Supabase + `next/*` so no live DB is touched, write behavior tests for `lib/submission-guard.ts` and `lib/auth.ts`, then wire enforcement: a husky pre-push hook and a GitHub Actions workflow, finishing with branch protection on `main`.

**Tech Stack:** Vitest 4, TypeScript, Next.js 16 (App Router), Supabase (`@supabase/supabase-js`, `@supabase/ssr`), husky 9, GitHub Actions, `gh` CLI.

## Global Constraints

- **Never touch the live Supabase DB in tests.** All DB/auth access is mocked. No test makes a network call. (Guard/auth use `createAdminClient()` / `createClient()` — mock these.)
- **No new runtime dependencies.** The only new dependency is a devDependency: `husky`.
- **The existing 33 tests must keep passing** unchanged after every task.
- **CI runs on Node 24** (matches Vercel's production default). Local dev may be Node 20; both run Vitest fine.
- **Follow the existing test style:** Vitest `describe`/`it`, one behavior per `it`, imports from `vitest`.
- **The `@` alias maps to the project root** (mirrors `tsconfig.json` `paths: { "@/*": ["./*"] }`).
- **Branch protection must be reversible** — document the disable command.

## File Structure

- Create: `vitest.config.ts` — Vitest config adding the `@` → project-root alias.
- Create: `test/helpers/supabase.ts` — fake Supabase clients (admin + SSR) for tests.
- Create: `test/helpers/form-data.ts` — builds a `FormData` from a plain object.
- Create: `lib/auth.test.ts` — tests for `getSessionUser` / `requireRole`.
- Create: `lib/submission-guard.test.ts` — tests for `guardSubmission`.
- Create: `.husky/pre-push` — runs `npm test` before every push.
- Modify: `package.json` — add `husky` devDep + `"prepare": "husky"` script (via `npx husky init`).
- Create: `.github/workflows/ci.yml` — lint + typecheck + test on push and PRs to `main`.

---

### Task 1: Vitest `@`-alias config

**Files:**
- Create: `vitest.config.ts`
- Test: the existing suite (`lib/*.test.ts`) must still pass.

**Interfaces:**
- Consumes: nothing.
- Produces: resolves `@/...` imports in all test files (later tasks import `@/lib/supabase/admin` and `@/lib/supabase/server`).

- [ ] **Step 1: Write the config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  resolve: {
    alias: {
      // Mirror tsconfig `paths: { "@/*": ["./*"] }` so tests can import `@/lib/...`.
      '@': rootDir,
    },
  },
})
```

- [ ] **Step 2: Verify the existing tests still pass**

Run: `npm test`
Expected: PASS — `Test Files 4 passed (4)`, `Tests 33 passed (33)`.

- [ ] **Step 3: Commit**

```bash
git add vitest.config.ts
git commit -m "test: add vitest @-alias config"
```

---

### Task 2: Auth tests + Supabase test helpers

**Files:**
- Create: `test/helpers/supabase.ts`
- Create: `lib/auth.test.ts`
- Test: `lib/auth.test.ts`

**Interfaces:**
- Consumes: `getSessionUser(): Promise<SessionUser | null>` and `requireRole(role: Role | Role[]): Promise<SessionUser>` from `lib/auth.ts`. `SessionUser = { id: string; email?: string; role: 'admin' | null }`.
- Produces: `fakeAdminClient(opts?: { throttleRows?: { created_at: string }[]; dupe?: boolean })` and `fakeServerClient(claims: Record<string, unknown> | null)` in `test/helpers/supabase.ts` (Task 3 reuses `fakeAdminClient`).

- [ ] **Step 1: Write the test helpers**

Create `test/helpers/supabase.ts`:

```ts
import { vi } from 'vitest'

// Chainable fake of the service-role client used by lib/submission-guard.ts.
// Every builder method returns the same object, and the object is awaitable
// (thenable) resolving to { data, error } — so both
//   await supabase.from(t).select().eq().gte()   (throttle read)
// and
//   await supabase.from(t).insert(...)            (throttle write, result ignored)
// work without a real network call.
export function fakeAdminClient(
  opts: { throttleRows?: { created_at: string }[]; dupe?: boolean } = {},
) {
  const throttleRows = opts.throttleRows ?? []
  const dupe = opts.dupe ?? false

  const builder: Record<string, unknown> = {}
  const chain = () => builder
  Object.assign(builder, {
    select: chain,
    eq: chain,
    gte: chain,
    lt: chain,
    insert: chain,
    delete: chain,
    // Thenable: `await builder` resolves here.
    then: (resolve: (v: unknown) => void) =>
      resolve({ data: throttleRows, error: null }),
  })

  return {
    from: () => builder,
    rpc: async () => ({ data: dupe, error: null }),
  }
}

// Fake of the SSR client used by lib/auth.ts. getClaims() resolves to the shape
// Supabase returns: { data: { claims } }.
export function fakeServerClient(claims: Record<string, unknown> | null) {
  return {
    auth: {
      getClaims: vi.fn(async () => ({ data: { claims } })),
    },
  }
}
```

- [ ] **Step 2: Write the failing test**

Create `lib/auth.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeServerClient } from '../test/helpers/supabase'

// Mock Next's redirect so it behaves like the real one: it halts execution by
// throwing. We assert on the thrown message and on the mock's call args.
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`)
  }),
}))

// Mock the SSR Supabase client factory; each test supplies the claims.
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSessionUser, requireRole } from './auth'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getSessionUser', () => {
  it('returns null when there are no claims', async () => {
    vi.mocked(createClient).mockResolvedValue(fakeServerClient(null) as never)
    expect(await getSessionUser()).toBeNull()
  })

  it('maps claims to id, email, and role from app_metadata', async () => {
    vi.mocked(createClient).mockResolvedValue(
      fakeServerClient({
        sub: 'user-1',
        email: 'admin@example.com',
        app_metadata: { role: 'admin' },
      }) as never,
    )
    expect(await getSessionUser()).toEqual({
      id: 'user-1',
      email: 'admin@example.com',
      role: 'admin',
    })
  })

  it('defaults role to null when app_metadata has no role', async () => {
    vi.mocked(createClient).mockResolvedValue(
      fakeServerClient({ sub: 'user-2', email: 'nobody@example.com' }) as never,
    )
    expect(await getSessionUser()).toMatchObject({ id: 'user-2', role: null })
  })
})

describe('requireRole', () => {
  it('redirects to /admin when unauthenticated', async () => {
    vi.mocked(createClient).mockResolvedValue(fakeServerClient(null) as never)
    await expect(requireRole('admin')).rejects.toThrow('REDIRECT:/admin')
    expect(redirect).toHaveBeenCalledWith('/admin')
  })

  it('redirects to /admin when the role does not match', async () => {
    vi.mocked(createClient).mockResolvedValue(
      fakeServerClient({ sub: 'user-3', app_metadata: {} }) as never,
    )
    await expect(requireRole('admin')).rejects.toThrow('REDIRECT:/admin')
    expect(redirect).toHaveBeenCalledWith('/admin')
  })

  it('returns the user when the role matches', async () => {
    vi.mocked(createClient).mockResolvedValue(
      fakeServerClient({
        sub: 'user-4',
        email: 'admin@example.com',
        app_metadata: { role: 'admin' },
      }) as never,
    )
    const user = await requireRole('admin')
    expect(user).toEqual({ id: 'user-4', email: 'admin@example.com', role: 'admin' })
    expect(redirect).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 3: Run the test to verify it passes**

Run: `npx vitest run lib/auth.test.ts`
Expected: PASS — 5 tests. (The mocks make it pass immediately; there is no production code to change. This task's purpose is coverage, so a green run is the success condition.)

- [ ] **Step 4: Verify the full suite still passes**

Run: `npm test`
Expected: PASS — `Tests 38 passed (38)` (33 existing + 5 new).

- [ ] **Step 5: Commit**

```bash
git add test/helpers/supabase.ts lib/auth.test.ts
git commit -m "test: cover getSessionUser and requireRole"
```

---

### Task 3: Submission-guard tests + FormData helper

**Files:**
- Create: `test/helpers/form-data.ts`
- Create: `lib/submission-guard.test.ts`
- Test: `lib/submission-guard.test.ts`

**Interfaces:**
- Consumes: `guardSubmission(formData: FormData): Promise<GuardResult>` from `lib/submission-guard.ts`, where `GuardResult = { ok: true; email: string } | { ok: false; error: 'rate' | 'invalid' | 'duplicate' }`. Also reuses `fakeAdminClient` from Task 2's `test/helpers/supabase.ts`.
- Produces: `formDataFrom(fields: Record<string, string | number | null | undefined>): FormData` in `test/helpers/form-data.ts`.

- [ ] **Step 1: Write the FormData helper**

Create `test/helpers/form-data.ts`:

```ts
// Builds a FormData from a plain object. Values are coerced to strings, matching
// how a browser submits <form> fields. null/undefined values are skipped so a
// test can omit a field entirely.
export function formDataFrom(
  fields: Record<string, string | number | null | undefined>,
): FormData {
  const fd = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    if (value === null || value === undefined) continue
    fd.append(key, String(value))
  }
  return fd
}
```

- [ ] **Step 2: Write the failing test**

Create `lib/submission-guard.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fakeAdminClient } from '../test/helpers/supabase'
import { formDataFrom } from '../test/helpers/form-data'

// Give clientIpHash() a stable IP to hash — no real request headers in tests.
vi.mock('next/headers', () => ({
  headers: vi.fn(async () => ({
    get: (key: string) => (key === 'x-forwarded-for' ? '203.0.113.5' : null),
  })),
}))

// Mock the service-role client factory; each test supplies throttle rows + dupe.
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

import { createAdminClient } from '@/lib/supabase/admin'
import { guardSubmission } from './submission-guard'

// A submission that passes every check when the DB reports no throttle + no dupe.
function validFields() {
  return { email: 'Test@Example.com', business_name: 'Acme Studio', state: 'CA' }
}

function isoMinutesAgo(min: number) {
  return new Date(Date.now() - min * 60 * 1000).toISOString()
}

beforeEach(() => {
  vi.clearAllMocks()
  // Default: empty throttle ledger, no duplicate.
  vi.mocked(createAdminClient).mockReturnValue(fakeAdminClient() as never)
})

describe('guardSubmission — rate limiting', () => {
  it('rejects with "rate" at or above the hourly cap', async () => {
    const rows = Array.from({ length: 10 }, () => ({ created_at: isoMinutesAgo(30) }))
    vi.mocked(createAdminClient).mockReturnValue(
      fakeAdminClient({ throttleRows: rows }) as never,
    )
    expect(await guardSubmission(formDataFrom(validFields()))).toEqual({
      ok: false,
      error: 'rate',
    })
  })

  it('rejects with "rate" at or above the per-minute burst cap', async () => {
    const rows = Array.from({ length: 3 }, () => ({ created_at: isoMinutesAgo(0) }))
    vi.mocked(createAdminClient).mockReturnValue(
      fakeAdminClient({ throttleRows: rows }) as never,
    )
    expect(await guardSubmission(formDataFrom(validFields()))).toEqual({
      ok: false,
      error: 'rate',
    })
  })
})

describe('guardSubmission — validation', () => {
  it('rejects when email is missing', async () => {
    const { email, ...rest } = validFields()
    void email
    expect(await guardSubmission(formDataFrom(rest))).toEqual({
      ok: false,
      error: 'invalid',
    })
  })

  it('rejects a malformed email', async () => {
    expect(
      await guardSubmission(formDataFrom({ ...validFields(), email: 'not-an-email' })),
    ).toEqual({ ok: false, error: 'invalid' })
  })

  it('rejects when business name is missing', async () => {
    const { business_name, ...rest } = validFields()
    void business_name
    expect(await guardSubmission(formDataFrom(rest))).toEqual({
      ok: false,
      error: 'invalid',
    })
  })

  it('rejects an invalid state code', async () => {
    expect(
      await guardSubmission(formDataFrom({ ...validFields(), state: 'ZZ' })),
    ).toEqual({ ok: false, error: 'invalid' })
  })

  it('rejects a field longer than its max length', async () => {
    expect(
      await guardSubmission(
        formDataFrom({ ...validFields(), business_name: 'x'.repeat(121) }),
      ),
    ).toEqual({ ok: false, error: 'invalid' })
  })

  it('rejects a phone with disallowed characters', async () => {
    expect(
      await guardSubmission(formDataFrom({ ...validFields(), phone: 'call me' })),
    ).toEqual({ ok: false, error: 'invalid' })
  })

  it('rejects a URL field that is not http(s)', async () => {
    expect(
      await guardSubmission(
        formDataFrom({ ...validFields(), website_url: 'ftp://example.com' }),
      ),
    ).toEqual({ ok: false, error: 'invalid' })
  })
})

describe('guardSubmission — duplicates', () => {
  it('rejects with "duplicate" when the RPC reports a match', async () => {
    vi.mocked(createAdminClient).mockReturnValue(
      fakeAdminClient({ dupe: true }) as never,
    )
    expect(await guardSubmission(formDataFrom(validFields()))).toEqual({
      ok: false,
      error: 'duplicate',
    })
  })
})

describe('guardSubmission — success', () => {
  it('returns ok with the email normalized to lowercase', async () => {
    expect(await guardSubmission(formDataFrom(validFields()))).toEqual({
      ok: true,
      email: 'test@example.com',
    })
  })
})
```

- [ ] **Step 3: Run the test to verify it passes**

Run: `npx vitest run lib/submission-guard.test.ts`
Expected: PASS — 11 tests.

- [ ] **Step 4: Verify the full suite still passes**

Run: `npm test`
Expected: PASS — `Tests 49 passed (49)` (33 + 5 + 11).

- [ ] **Step 5: Commit**

```bash
git add test/helpers/form-data.ts lib/submission-guard.test.ts
git commit -m "test: cover submission guard rate/validation/dupe rules"
```

---

### Task 4: Pre-push hook (local gate)

**Files:**
- Create: `.husky/pre-push`
- Modify: `package.json` (adds `husky` devDep + `"prepare": "husky"`; `npx husky init` does this)

**Interfaces:**
- Consumes: `npm test` (runs the full Vitest suite).
- Produces: a git pre-push hook that blocks pushes when tests fail.

- [ ] **Step 1: Install husky and initialize**

```bash
npm install --save-dev husky
npx husky init
```

`husky init` adds `"prepare": "husky"` to `package.json`, creates `.husky/` (with an auto-managed `.husky/_/` that husky gitignores), and writes a sample `.husky/pre-commit`.

- [ ] **Step 2: Replace the sample hook with a pre-push hook**

```bash
rm -f .husky/pre-commit
```

Create `.husky/pre-push` with exactly:

```sh
npm test
```

Then make it executable:

```bash
chmod +x .husky/pre-push
```

- [ ] **Step 3: Verify the hook runs the suite**

Run: `sh .husky/pre-push`
Expected: PASS — the full Vitest suite runs and reports `Tests 49 passed (49)`. (This executes the hook's command directly; on an actual `git push` the same command runs and a non-zero exit blocks the push.)

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json .husky/pre-push
git commit -m "chore: add husky pre-push hook running tests"
```

---

### Task 5: GitHub Actions CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: `npm ci`, `npm run lint`, `npx tsc --noEmit`, `npm test`.
- Produces: a status check named `test` (the job id) on every push and on PRs to `main`. Task 6's branch protection requires this exact check name.

- [ ] **Step 1: Write the workflow**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npm test
```

No secrets are configured or referenced — the tests mock Supabase, so CI never needs DB credentials.

- [ ] **Step 2: Sanity-check the CI steps locally**

Run each CI step locally to confirm they pass before pushing:

```bash
npm run lint
npx tsc --noEmit
npm test
```

Expected: all three succeed (lint clean, no type errors, `Tests 49 passed (49)`).

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: run lint, typecheck, and tests on push and PRs"
```

---

### Task 6: Open the PR and enable branch protection

**Files:** none (GitHub operations only).

**Interfaces:**
- Consumes: the `test` status check produced by Task 5.
- Produces: a PR for `add-baseline-tests`, and branch protection on `main` requiring the `test` check to pass and forcing changes through PRs.

- [ ] **Step 1: Push the branch and open the PR**

```bash
git push -u origin add-baseline-tests
gh pr create --fill --base main
```

- [ ] **Step 2: Wait for CI to pass on the PR**

Run: `gh pr checks --watch`
Expected: the `test` check reports ✅ (green). Do NOT enable protection until this is green, so the required check is proven to work first.

- [ ] **Step 3: Enable branch protection on `main`**

Requires CI to pass before merge, forces changes through PRs (no direct pushes), and applies to admins too:

```bash
gh api -X PUT repos/Javi-Vargas/purely-gold-co/branches/main/protection \
  --input - <<'JSON'
{
  "required_status_checks": { "strict": true, "contexts": ["test"] },
  "enforce_admins": true,
  "required_pull_request_reviews": { "required_approving_review_count": 0 },
  "restrictions": null
}
JSON
```

Notes:
- `contexts: ["test"]` must match the job id in `ci.yml`. If the check name differs, list it with `gh pr checks` and update this array.
- `required_approving_review_count: 0` means "a PR is required, but you can merge your own without a second approver" — right for a solo maintainer while still blocking direct pushes.
- `enforce_admins: true` means the rule applies to you too; merges still succeed once CI is green.

- [ ] **Step 4: Verify protection is active**

Run: `gh api repos/Javi-Vargas/purely-gold-co/branches/main/protection --jq '.required_status_checks.contexts, .enforce_admins.enabled'`
Expected: prints `["test"]` and `true`.

- [ ] **Step 5: Merge the PR once CI is green**

```bash
gh pr merge --squash --delete-branch
```

**To disable branch protection later (fully reversible):**

```bash
gh api -X DELETE repos/Javi-Vargas/purely-gold-co/branches/main/protection
```

Or in the GitHub UI: Settings → Branches → delete the `main` rule.

---

## Self-Review

**1. Spec coverage:**
- Vitest `@`-alias config → Task 1 ✅
- Test helpers (fake Supabase + `next/*` mocks) → Task 2 (`fakeAdminClient`/`fakeServerClient`, `next/navigation` mock) + Task 3 (`formDataFrom`, `next/headers` mock) ✅
- `lib/submission-guard.test.ts` (rate/validation/dupe/happy) → Task 3 ✅
- `lib/auth.test.ts` (getSessionUser + requireRole) → Task 2 ✅
- Pre-push hook → Task 4 ✅
- GitHub Actions CI (Node 24, no secrets) → Task 5 ✅
- Branch protection, reversible → Task 6 ✅
- Rollout order (protection last, after CI green) → Task 6 Steps 2–3 ✅
- Out of scope (server actions, components, email) → not planned ✅

**2. Placeholder scan:** No TBD/TODO/"add error handling" placeholders; every code and command step is concrete. ✅

**3. Type consistency:** `GuardResult` error codes (`'rate' | 'invalid' | 'duplicate'`) and success shape (`{ ok: true, email }`) match `lib/submission-guard.ts`. `SessionUser` shape matches `types/index.ts`. `fakeAdminClient`/`fakeServerClient`/`formDataFrom` signatures are identical everywhere they appear. The CI job id `test` matches the `contexts: ["test"]` in branch protection. ✅
