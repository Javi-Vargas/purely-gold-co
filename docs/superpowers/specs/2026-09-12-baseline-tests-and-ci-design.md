# Baseline Tests + CI Gate — Design

**Date:** 2026-09-12
**Branch:** `add-baseline-tests`
**Status:** Approved (design), pending implementation plan

## Goal

Make automated tests run *before* new work lands, so a change cannot reach
production (`main` → Vercel) without passing. Two things stand in the way today:

1. The highest-risk logic — the public submission abuse guard and the admin
   auth gate — has **zero tests**.
2. Nothing enforces the existing tests. Changes have been landing on `main` via
   direct commits and local `git merge`, bypassing any review or CI checkpoint.

This design closes both gaps. It does **not** add app features or change runtime
behavior — it is test + config only.

## Context / what already exists

- **Vitest is installed and working.** `npm test` runs `vitest run`; there are
  33 passing tests across 4 pure-helper files (`business-hours`, `social-links`,
  `us-locations`, `us-locations-data`). These stay as-is.
- **Repo is on GitHub** (`Javi-Vargas/purely-gold-co`) with `gh` authenticated.
  GitHub Actions is available by default — no provisioning needed.
- **Hard constraint:** work targets the *live* Supabase DB. Tests must **never**
  touch it. The guard and server actions call `createAdminClient()`, so testing
  them means mocking Supabase, never connecting.

## Scope

### In scope
- One-time Vitest config so `@/…` imports resolve in tests.
- Unit tests for `lib/submission-guard.ts` and `lib/auth.ts` (Supabase and
  `next/*` mocked; no network, no DB).
- Local **pre-push hook** (husky) running `npm test`.
- **GitHub Actions CI** on push + PR to `main`.
- **Branch protection** on `main`: require the CI check to pass before merge and
  block direct pushes. Explicitly reversible.

### Out of scope (YAGNI)
- Tests for the server actions (`submitListing`, `approveListing`,
  `declineListing`), React components, and email sending. The guard + auth hold
  the real business rules and security invariants; the actions are thin glue.
  Revisit later if desired.
- Any change to application code or the database.

## Component 1 — Vitest config (required setup)

`submission-guard.ts` and `auth.ts` import via the `@/…` alias, which Vitest
does not resolve by default. Add a minimal **`vitest.config.ts`** mapping `@` →
project root (no new dependency). The existing 33 tests must keep passing
unchanged after this is added.

## Component 2 — Test helpers

A small `test/helpers/` module providing:
- A **chainable fake Supabase client** — supports the call shapes the code uses
  (`from().select().eq().gte()`, `from().insert()`, `rpc()`), returning
  caller-supplied data/values so each test controls the DB response.
- Mock helpers for **`next/headers`** (`headers()` returning a fake header bag,
  e.g. `x-forwarded-for`) and **`next/navigation`** (`redirect()` — mocked to
  throw a recognizable sentinel so tests can assert it was called and with what).

## Component 3 — `lib/submission-guard.test.ts`

Covers the spam/abuse defense. Behaviors:
- **Rate limit:** rejects with `'rate'` at ≥ `HOURLY_MAX` (10) rows in the last
  hour, and at ≥ `BURST_MAX` (3) in the last minute; allows when under both.
- **Validation** (each rejects with `'invalid'`): missing or malformed email;
  missing business name; invalid state code; a field longer than its `MAX_LEN`;
  phone with disallowed characters; a URL field not starting with `http(s)://`.
- **Duplicate:** rejects with `'duplicate'` when the `listing_duplicate_exists`
  RPC returns `true`.
- **Happy path:** returns `{ ok: true, email }` with the email normalized to
  lowercase.

## Component 4 — `lib/auth.test.ts`

Covers the only gate protecting `/admin`. Behaviors:
- `getSessionUser` returns `null` when there are no claims.
- `getSessionUser` maps claims → `{ id, email, role }`, reading the role from
  `app_metadata.role`.
- `requireRole('admin')` redirects to `/admin` when unauthenticated.
- `requireRole('admin')` redirects when the role is missing or mismatched.
- `requireRole('admin')` returns the user when the role matches.

## Component 5 — Pre-push hook (local gate)

Husky pre-push hook running `npm test`. Husky auto-activates on `npm install`
via a `prepare` script, so it works for any clone without manual setup. Blocks
the push on failure. Fast today (<1s), so not disruptive. Note: the hook is
active for pushes to *any* branch, including `main`.

## Component 6 — GitHub Actions CI (authoritative gate)

`.github/workflows/ci.yml`, triggered on push and on PRs targeting `main`.
Runner: `ubuntu-latest`, Node 24, npm cache enabled. Steps:
`npm ci` → `npm run lint` → `npx tsc --noEmit` → `npm test`.
**No secrets required** — tests mock Supabase, so CI never sees DB credentials.

## Component 7 — Branch protection on `main`

Configure via `gh api` (or Settings → Branches): require the CI status check to
pass before merging, and block direct pushes so changes must arrive as PRs.
**Reversible** at any time with
`gh api -X DELETE repos/Javi-Vargas/purely-gold-co/branches/main/protection`
or the equivalent UI toggle — no effect on code.

## Verification

- After Component 1: `npm test` → the existing 33 tests still pass.
- After Components 3–4: `npm test` → new guard + auth tests pass; no network/DB
  access occurs.
- After Component 6: the workflow runs green on the `add-baseline-tests` PR
  (visible in the Actions tab and as a PR check) before any protection is
  enforced.
- After Component 7: a direct push to `main` is rejected; a PR cannot be merged
  until the CI check is green.

## Rollout order

Land test infrastructure and tests first, confirm CI runs green on the PR, and
enable branch protection **last** — so the required check is proven working
before it becomes mandatory.
