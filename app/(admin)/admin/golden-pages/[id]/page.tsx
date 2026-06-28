import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Shell } from '@/components/layout/Shell'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Label, Select, Textarea } from '@/components/ui/Input'
import { createClient } from '@/lib/supabase/server'
import { serviceTypeLabel } from '@/lib/utils'
import type { GoldenPagesProfile, GoldenPagesStatus } from '@/types'
import { ArrowLeft } from 'lucide-react'
import { approveListing, declineListing } from '../actions'
import { DECLINE_REASONS } from '../constants'

const STATUS_TONE: Record<GoldenPagesStatus, 'gold' | 'green' | 'red'> = {
  pending: 'gold',
  approved: 'green',
  declined: 'red',
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 text-cream-dim">{value || '—'}</p>
    </div>
  )
}

export default async function AdminGoldenPageDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('golden_pages_profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (!data) notFound()
  const listing = data as GoldenPagesProfile

  return (
    <Shell title="Golden Pages Listing">
      <Link
        href="/admin/golden-pages"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted hover:text-cream"
      >
        <ArrowLeft size={16} /> Back to queue
      </Link>

      <div className="flex items-center gap-3">
        <h2 className="font-display text-3xl text-cream">
          {listing.business_name ?? 'Unnamed business'}
        </h2>
        <Badge tone={STATUS_TONE[listing.status]} className="capitalize">
          {listing.status}
        </Badge>
      </div>

      <div className="mt-8 grid max-w-3xl gap-6">
        <Card className="grid gap-4 sm:grid-cols-2">
          <Field label="Service type" value={serviceTypeLabel(listing.service_type)} />
          <Field label="Contact name" value={listing.contact_name} />
          <Field label="Email" value={listing.email} />
          <Field label="Phone" value={listing.phone} />
          <Field label="Website" value={listing.website_url} />
          <Field label="Business hours" value={listing.business_hours} />
          <Field
            label="Location"
            value={[listing.city, listing.state].filter(Boolean).join(', ')}
          />
        </Card>

        {listing.bio && (
          <Card>
            <p className="text-xs uppercase tracking-wider text-muted">About</p>
            <p className="mt-2 text-cream-dim">{listing.bio}</p>
          </Card>
        )}

        {listing.decline_reason && (
          <Card className="border-red-500/30">
            <p className="text-xs uppercase tracking-wider text-muted">Decline reason</p>
            <p className="mt-1 text-cream-dim">{listing.decline_reason}</p>
          </Card>
        )}

        {/* Action panel */}
        <Card className="space-y-4">
          <p className="font-medium text-cream">Review</p>
          <div className="flex flex-wrap items-center gap-3">
            <form action={approveListing}>
              <input type="hidden" name="id" value={listing.id} />
              <Button type="submit">Approve & publish</Button>
            </form>

            <details className="group">
              <summary className="cursor-pointer list-none">
                <span className="inline-flex items-center rounded-xl border border-line px-4 py-2.5 text-sm text-cream-dim transition-colors hover:text-cream">
                  Decline…
                </span>
              </summary>
              <form action={declineListing} className="mt-4 space-y-4">
                <input type="hidden" name="id" value={listing.id} />
                <div>
                  <Label htmlFor="reason">Reason (shown to the business)</Label>
                  <Select id="reason" name="reason" defaultValue="">
                    <option value="">No reason given</option>
                    {DECLINE_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="admin_notes">Internal note (not shown to business)</Label>
                  <Textarea id="admin_notes" name="admin_notes" />
                </div>
                <Button type="submit" variant="secondary">
                  Confirm decline
                </Button>
              </form>
            </details>
          </div>
        </Card>
      </div>
    </Shell>
  )
}
