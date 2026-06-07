import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { serviceTypeLabel } from '@/lib/utils'
import { Globe, Phone, Clock, MapPin, ArrowRight } from 'lucide-react'
import type { GoldenPagesProfile } from '@/types'

export const metadata = { title: 'Golden Pages — Purely GOLD Co.' }

type Listing = Pick<
  GoldenPagesProfile,
  | 'id'
  | 'business_name'
  | 'service_type'
  | 'city'
  | 'state'
  | 'bio'
  | 'phone'
  | 'website_url'
  | 'business_hours'
>

export default async function GoldenPagesDirectory() {
  const supabase = await createClient()
  // RLS allows anon to read only is_visible = true rows.
  const { data } = await supabase
    .from('golden_pages_profiles')
    .select(
      'id, business_name, service_type, city, state, bio, phone, website_url, business_hours',
    )
    .eq('is_visible', true)
    .order('business_name')

  const listings = (data ?? []) as Listing[]

  return (
    <div className="mx-auto max-w-5xl px-6 py-20">
      {/* Header */}
      <p className="text-xs uppercase tracking-[0.24em] text-gold-dim">Golden Pages</p>
      <h1 className="mt-3 font-display text-5xl font-medium text-cream">
        Business Directory
      </h1>
      <div className="mt-4 h-px w-10 bg-gold" />
      <p className="mt-4 max-w-xl text-cream-dim">
        Production businesses listed by Purely GOLD Co. Contact them directly — visit
        their website, call, or stop by. No account required.
      </p>

      {/* Count + list CTA */}
      <div className="mt-10 flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.1em] text-muted">
          {listings.length} {listings.length === 1 ? 'Listing' : 'Listings'}
        </span>
        <Link href="/signup?role=golden_pages">
          <Button size="sm">
            List My Business <ArrowRight size={16} />
          </Button>
        </Link>
      </div>

      {/* Listings */}
      {listings.length === 0 ? (
        <Card className="mt-6 border-dashed text-center">
          <p className="text-cream-dim">
            No public listings yet. Businesses that join Golden Pages will appear here.
          </p>
        </Card>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {listings.map((l) => (
            <Card
              key={l.id}
              className="flex flex-col gap-4 transition-colors hover:border-gold/40 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={`/golden-pages/${l.id}`}
                    className="font-medium text-cream hover:text-gold"
                  >
                    {l.business_name ?? 'Unnamed business'}
                  </Link>
                  <Badge tone="gold">{serviceTypeLabel(l.service_type)}</Badge>
                </div>

                {(l.city || l.state) && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                    <MapPin size={13} className="text-gold-dim" />
                    {[l.city, l.state].filter(Boolean).join(', ')}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-cream-dim">
                  {l.phone && (
                    <span className="flex items-center gap-2">
                      <Phone size={14} className="text-gold" />
                      {l.phone}
                    </span>
                  )}
                  {l.website_url && (
                    <span className="flex items-center gap-2">
                      <Globe size={14} className="text-gold" />
                      {l.website_url.replace(/^https?:\/\//, '')}
                    </span>
                  )}
                  {l.business_hours && (
                    <span className="flex items-center gap-2">
                      <Clock size={14} className="text-gold" />
                      {l.business_hours}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-shrink-0 gap-2">
                {l.website_url && (
                  <a href={l.website_url} target="_blank" rel="noreferrer">
                    <Button variant="secondary" size="sm">
                      Visit Website
                    </Button>
                  </a>
                )}
                {l.phone && (
                  <a href={`tel:${l.phone.replace(/[^\d+]/g, '')}`}>
                    <Button variant="ghost" size="sm">
                      Call
                    </Button>
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Get listed banner */}
      <Card className="mt-12 border-gold/20">
        <h2 className="font-display text-2xl font-medium text-cream">
          Get your business listed
        </h2>
        <p className="mt-2 max-w-xl text-sm text-cream-dim">
          A Golden Pages listing puts your name, contact info, and website in front of
          clients actively looking for production services.
        </p>
        <Link href="/signup?role=golden_pages" className="mt-5 inline-block">
          <Button>
            List My Business <ArrowRight size={16} />
          </Button>
        </Link>
      </Card>
    </div>
  )
}
