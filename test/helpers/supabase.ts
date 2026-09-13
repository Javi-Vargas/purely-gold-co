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
