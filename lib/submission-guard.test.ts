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
