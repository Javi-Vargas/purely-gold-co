import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Globe, Phone, MapPin, Clock } from 'lucide-react'

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
    .maybeSingle()

  if (!listing) notFound()

  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <p className="text-xs uppercase tracking-[0.2em] text-gold-soft">
        {listing.service_type ?? 'Business'}
      </p>
      <h1 className="mt-2 font-display text-5xl font-medium text-cream">
        {listing.business_name ?? 'Unnamed business'}
      </h1>
      {listing.bio && <p className="mt-6 text-lg text-cream-dim">{listing.bio}</p>}

      <Card className="mt-10 space-y-3">
        {(listing.address || listing.city) && (
          <div className="flex items-center gap-3 text-cream-dim">
            <MapPin size={18} className="text-gold" />
            {[listing.address, listing.city, listing.state, listing.zip]
              .filter(Boolean)
              .join(', ')}
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
      </Card>
    </div>
  )
}
