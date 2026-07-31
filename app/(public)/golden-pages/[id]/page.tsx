import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { serviceTypeLabel } from '@/lib/utils'
import { Globe, Phone, MapPin, Clock, ArrowLeft } from 'lucide-react'
import { SOCIAL_PLATFORMS } from '@/lib/social-links'
import { SocialIcon } from '@/components/social/SocialIcon'

export default async function GoldenPageListing({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: listing } = await supabase
    .from('golden_pages_profiles')
    .select('*')
    .eq('id', id)
    .eq('is_visible', true)
    .eq('status', 'approved')
    .maybeSingle()

  if (!listing) notFound()

  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <Link
        href="/golden-pages"
        className="mb-8 inline-flex items-center gap-2 text-sm text-muted hover:text-cream"
      >
        <ArrowLeft size={16} /> Back to Directory
      </Link>
      <p className="text-xs uppercase tracking-[0.2em] text-gold-soft">
        {serviceTypeLabel(listing.service_type)}
      </p>
      <h1 className="mt-2 font-display text-5xl font-medium text-cream">
        {listing.business_name ?? 'Unnamed business'}
      </h1>
      {listing.bio && <p className="mt-6 text-lg text-cream-dim">{listing.bio}</p>}

      <Card className="mt-10 space-y-3">
        {(listing.city || listing.state) && (
          <div className="flex items-center gap-3 text-cream-dim">
            <MapPin size={18} className="text-gold" />
            {[listing.city, listing.state].filter(Boolean).join(', ')}
          </div>
        )}
        {listing.phone && (
          <div className="flex items-center gap-3 text-cream-dim">
            <Phone size={18} className="text-gold" />
            {listing.phone}
          </div>
        )}
        {listing.website_url && (
          <div className="flex items-center gap-3 text-cream-dim">
            <Globe size={18} className="text-gold" />
            <a
              href={listing.website_url}
              className="hover:text-gold"
              target="_blank"
              rel="noreferrer"
            >
              {listing.website_url}
            </a>
          </div>
        )}
        {listing.business_hours && (
          <div className="flex items-center gap-3 text-cream-dim">
            <Clock size={18} className="text-gold" />
            {listing.business_hours}
          </div>
        )}
        {SOCIAL_PLATFORMS.some((p) => listing[p.key]) && (
          <div className="flex items-center gap-4 pt-1">
            {SOCIAL_PLATFORMS.filter((p) => listing[p.key]).map((p) => (
              <a
                key={p.key}
                href={listing[p.key] as string}
                target="_blank"
                rel="noreferrer"
                aria-label={p.label}
                className="text-gold hover:text-cream"
              >
                <SocialIcon platform={p.key} size={20} />
              </a>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
