import { headers } from 'next/headers'
import { createHash } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

// Shared abuse guard for the public /get-listed and /apply submissions. Runs
// before the listing is inserted and enforces, in order:
//   1. per-IP rate limiting (DB-backed, free — no Redis/CAPTCHA)
//   2. input validation + size caps
//   3. duplicate detection (email / phone / business name)
// Returns the normalized email to store, or an error code the action maps to a
// friendly message.

export type GuardResult =
  | { ok: true; email: string }
  | { ok: false; error: 'rate' | 'invalid' | 'duplicate' }

// Per-IP caps (DB-flood protection; volumetric DDoS is handled by Vercel).
const BURST_MAX = 3 // per minute
const HOURLY_MAX = 10 // per hour

// Max accepted length per field; anything longer is rejected as invalid.
const MAX_LEN: Record<string, number> = {
  business_name: 120,
  contact_name: 120,
  email: 200,
  phone: 40,
  website_url: 300,
  portfolio_url: 300,
  instagram_url: 200,
  business_hours: 120,
  city: 80,
  state: 80,
  location: 120,
  service_type: 40,
  years_experience: 10,
  bio: 2000,
  description: 2000,
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^[\d+\-()\s]+$/

function val(formData: FormData, key: string): string {
  const v = formData.get(key)
  return typeof v === 'string' ? v.trim() : ''
}

async function clientIpHash(): Promise<string> {
  const h = await headers()
  const fwd = h.get('x-forwarded-for')?.split(',')[0]?.trim()
  const ip = fwd || h.get('x-real-ip') || 'unknown'
  return createHash('sha256').update(ip).digest('hex')
}

export async function guardSubmission(formData: FormData): Promise<GuardResult> {
  const supabase = createAdminClient()

  // 1. Rate limit by hashed IP (counts every attempt, valid or not).
  const ipHash = await clientIpHash()
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const minuteAgo = new Date(Date.now() - 60 * 1000)
  const { data: recent } = await supabase
    .from('submission_throttle')
    .select('created_at')
    .eq('ip_hash', ipHash)
    .gte('created_at', hourAgo.toISOString())

  const rows = recent ?? []
  const inLastMinute = rows.filter((r) => new Date(r.created_at) > minuteAgo).length
  if (rows.length >= HOURLY_MAX || inLastMinute >= BURST_MAX) {
    return { ok: false, error: 'rate' }
  }
  await supabase.from('submission_throttle').insert({ ip_hash: ipHash })
  // Opportunistic prune so the ledger self-cleans without a cron job.
  if (Math.random() < 0.02) {
    await supabase
      .from('submission_throttle')
      .delete()
      .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
  }

  // 2. Validation + size caps on whatever fields were submitted.
  for (const [key, max] of Object.entries(MAX_LEN)) {
    if (val(formData, key).length > max) return { ok: false, error: 'invalid' }
  }
  const email = val(formData, 'email').toLowerCase()
  const businessName = val(formData, 'business_name')
  if (!email || !EMAIL_RE.test(email)) return { ok: false, error: 'invalid' }
  if (!businessName) return { ok: false, error: 'invalid' }

  const phoneRaw = val(formData, 'phone')
  if (phoneRaw && !PHONE_RE.test(phoneRaw)) return { ok: false, error: 'invalid' }
  for (const key of ['website_url', 'portfolio_url']) {
    const u = val(formData, key)
    if (u && !/^https?:\/\//i.test(u)) return { ok: false, error: 'invalid' }
  }
  const phoneDigits = phoneRaw.replace(/\D/g, '')

  // 3. Duplicate detection (email / phone / business name) among active listings.
  const { data: dupe } = await supabase.rpc('listing_duplicate_exists', {
    p_email: email,
    p_phone: phoneDigits,
    p_business_name: businessName,
  })
  if (dupe === true) return { ok: false, error: 'duplicate' }

  return { ok: true, email }
}
