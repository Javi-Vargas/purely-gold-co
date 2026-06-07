/**
 * Seed sample Golden Pages listings so the directory looks populated for the
 * launch/demo. Each listing is owned by a real auth user (the
 * golden_pages_profiles.user_id FK is NOT NULL), so we create the user via the
 * GoTrue admin API — the handle_new_user() trigger then auto-creates the profile
 * row, which we fill in and publish (is_visible = true).
 *
 * Uses plain fetch against the admin + PostgREST endpoints (no supabase-js, which
 * eagerly opens a realtime WebSocket that Node < 22 lacks natively).
 *
 * Run with the secret (service-role) key — NEVER expose this in the browser:
 *
 *   npx tsx --env-file=.env.local scripts/seed-golden-pages.ts
 *
 * Requires in the environment:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SECRET_KEY   (a.k.a. the service-role key)
 */
import type { ProviderServiceType } from '../types'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('Missing env. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY.')
  process.exit(1)
}

const authHeaders = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  'Content-Type': 'application/json',
}

interface Sample {
  email: string
  business_name: string
  contact_name: string
  service_type: ProviderServiceType
  phone: string
  website_url: string
  business_hours: string
  city: string
  state: string
  bio: string
}

const SAMPLES: Sample[] = [
  {
    email: 'studio44@seed.purelygold.test',
    business_name: 'Studio 44 Photography',
    contact_name: 'Dana Hill',
    service_type: 'photography',
    phone: '(615) 400-2211',
    website_url: 'https://studio44.co',
    business_hours: 'Mon–Fri 9am–6pm',
    city: 'Nashville',
    state: 'TN',
    bio: 'Editorial and commercial photography studio serving brands across the Southeast.',
  },
  {
    email: 'boldframe@seed.purelygold.test',
    business_name: 'Bold Frame Videography',
    contact_name: 'Marcus Lee',
    service_type: 'videography',
    phone: '(214) 555-0192',
    website_url: 'https://boldframe.tv',
    business_hours: 'By appointment',
    city: 'Dallas',
    state: 'TX',
    bio: 'Brand films and social video, from concept to final cut.',
  },
  {
    email: 'brandroom@seed.purelygold.test',
    business_name: 'The Brand Room',
    contact_name: 'Priya Anand',
    service_type: 'agency',
    phone: '(602) 388-7740',
    website_url: 'https://thebrandroom.agency',
    business_hours: 'Mon–Fri 8am–5pm',
    city: 'Phoenix',
    state: 'AZ',
    bio: 'Full-service creative agency specialising in identity and campaign strategy.',
  },
]

async function findUserIdByEmail(email: string): Promise<string | null> {
  const res = await fetch(`${url}/auth/v1/admin/users?per_page=200`, {
    headers: authHeaders,
  })
  if (!res.ok) return null
  const body = (await res.json()) as { users?: { id: string; email?: string }[] }
  return body.users?.find((u) => u.email === email)?.id ?? null
}

async function createUser(s: Sample): Promise<string | null> {
  const res = await fetch(`${url}/auth/v1/admin/users`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      email: s.email,
      password: crypto.randomUUID(),
      email_confirm: true,
      user_metadata: {
        role: 'golden_pages',
        business_name: s.business_name,
        contact_name: s.contact_name,
      },
    }),
  })

  if (res.ok) {
    const user = (await res.json()) as { id: string }
    return user.id
  }
  // Likely already seeded — reuse the existing user so the script is re-runnable.
  return findUserIdByEmail(s.email)
}

async function seedOne(s: Sample) {
  const userId = await createUser(s)
  if (!userId) {
    console.error(`  ✗ ${s.business_name}: could not create or find user`)
    return
  }

  // The trigger created the profile row on user insert; fill it in and publish.
  const res = await fetch(
    `${url}/rest/v1/golden_pages_profiles?user_id=eq.${userId}`,
    {
      method: 'PATCH',
      headers: { ...authHeaders, Prefer: 'return=minimal' },
      body: JSON.stringify({
        business_name: s.business_name,
        contact_name: s.contact_name,
        service_type: s.service_type,
        phone: s.phone,
        website_url: s.website_url,
        business_hours: s.business_hours,
        city: s.city,
        state: s.state,
        bio: s.bio,
        is_visible: true,
      }),
    },
  )

  if (!res.ok) {
    console.error(`  ✗ ${s.business_name}: ${res.status} ${await res.text()}`)
    return
  }
  console.log(`  ✓ ${s.business_name}`)
}

async function main() {
  console.log('Seeding Golden Pages listings…')
  for (const s of SAMPLES) {
    await seedOne(s)
  }
  console.log('Done.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
