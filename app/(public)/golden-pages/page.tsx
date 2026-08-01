import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { DirectoryListings, type DirectoryListing } from '@/components/golden-pages/DirectoryListings'
import { ArrowRight } from 'lucide-react'

export const metadata = { title: 'Business Directory — Golden Pages' }

export default async function GoldenPagesDirectory() {
  const supabase = await createClient()
  // RLS allows anon to read only is_visible = true rows.
  const { data } = await supabase
    .from('golden_pages_profiles')
    .select(
      'id, business_name, service_type, city, state, bio, phone, website_url, business_hours, instagram_url, tiktok_url, youtube_url, facebook_url',
    )
    .eq('is_visible', true)
    .eq('status', 'approved')
    .order('business_name')

  const listings = (data ?? []) as DirectoryListing[]

  return (
    <div className="mx-auto max-w-5xl px-6 py-20">
      {/* Header */}
      <p className="text-xs uppercase tracking-[0.24em] text-gold-dim">Golden Network</p>
      <h1 className="mt-3 font-display text-5xl font-medium text-cream">
        Business Directory
      </h1>
      <div className="mt-4 h-px w-10 bg-gold" />
      <p className="mt-4 max-w-xl text-cream-dim">
        Golden Network connects brands, agencies, and businesses with vetted
marketing, media, and production professionals. Making it easier to
discover trusted partners for every campaign.
      </p>

      {/* Count, filters, and listings (client-side filtering) */}
      <DirectoryListings listings={listings} />

      {/* Get listed banner */}
      <Card className="mt-12 border-gold/20">
        <h2 className="font-display text-2xl font-medium text-cream">
          Get your business listed
        </h2>
        <p className="mt-2 max-w-xl text-sm text-cream-dim">
          A Golden Pages listing puts your name, contact info, and website in front of
          clients actively looking for production services.
        </p>
        <Link href="/get-listed" className="mt-5 inline-block">
          <Button>
            List My Business <ArrowRight size={16} />
          </Button>
        </Link>
      </Card>
    </div>
  )
}
