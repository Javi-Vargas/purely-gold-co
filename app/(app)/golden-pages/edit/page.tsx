import { requireRole } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Shell } from '@/components/layout/Shell'
import { Placeholder } from '@/components/ui/Placeholder'
import { ListingForm } from '@/components/golden-pages/ListingForm'
import type { GoldenPagesProfile } from '@/types'

export default async function EditListingPage() {
  const user = await requireRole('golden_pages')
  const supabase = await createClient()

  // RLS ("gp: read own") scopes this to the caller's own listing.
  const { data: profile } = await supabase
    .from('golden_pages_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle<GoldenPagesProfile>()

  return (
    <Shell title="Edit Your Listing">
      <p className="mb-8 max-w-2xl text-cream-dim">
        Keep your public Golden Pages listing up to date. Publish when you’re ready to
        appear in the directory.
      </p>
      {profile ? (
        <ListingForm profile={profile} />
      ) : (
        <Placeholder note="We couldn’t find your listing. Please contact support." />
      )}
    </Shell>
  )
}
