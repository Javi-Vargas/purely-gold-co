import { createClient } from '@supabase/supabase-js'

// Service-role Supabase client. This BYPASSES Row Level Security, so it must only
// ever be used in trusted server code (Server Actions / Route Handlers) — never
// imported into a client component, and never with user-supplied table/column input.
//
// We use it for the public "Get Listed" submission: anonymous visitors have no
// INSERT policy on golden_pages_profiles (by design, to prevent spam/arbitrary
// writes), so the vetted server action inserts the pending row on their behalf.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secret = process.env.SUPABASE_SECRET_KEY
  if (!url || !secret) {
    throw new Error('Supabase service-role env (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY) is not set')
  }
  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
