import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import type { GoldenPagesProfile } from '@/types'

export const metadata = { title: 'Golden Pages — Purely GOLD Co.' }

export default async function GoldenPagesDirectory() {
  const supabase = await createClient()
  // RLS allows anon to read only is_visible = true rows.
  const { data } = await supabase
    .from('golden_pages_profiles')
    .select('id, business_name, service_type, city, state, bio')
    .eq('is_visible', true)
    .order('business_name')

  const listings = (data ?? []) as Pick<
    GoldenPagesProfile,
    'id' | 'business_name' | 'service_type' | 'city' | 'state' | 'bio'
  >[]

  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <h1 className="font-display text-5xl font-medium text-cream">Golden Pages</h1>
      <p className="mt-4 max-w-xl text-cream-dim">
        A public directory of businesses. Browse freely — no account required.
      </p>

      {listings.length === 0 ? (
        <Card className="mt-12 border-dashed text-center">
          <p className="text-cream-dim">
            No public listings yet. Businesses that join Golden Pages will appear here.
          </p>
        </Card>
      ) : (
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => (
            <Link key={l.id} href={`/golden-pages/${l.id}`}>
              <Card className="h-full transition-colors hover:border-gold/50">
                <CardTitle className="text-xl">
                  {l.business_name ?? 'Unnamed business'}
                </CardTitle>
                <p className="mt-1 text-xs uppercase tracking-wider text-gold-soft">
                  {l.service_type ?? '—'}
                  {l.city ? ` · ${l.city}${l.state ? `, ${l.state}` : ''}` : ''}
                </p>
                {l.bio && <CardDescription>{l.bio}</CardDescription>}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
