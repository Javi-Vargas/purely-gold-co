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
