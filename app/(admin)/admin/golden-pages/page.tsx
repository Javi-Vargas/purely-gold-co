import Link from 'next/link'
import { Shell } from '@/components/layout/Shell'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/server'
import { serviceTypeLabel, cn } from '@/lib/utils'
import type { GoldenPagesProfile, GoldenPagesStatus } from '@/types'

const TABS = ['pending', 'approved', 'declined', 'all'] as const
type Tab = (typeof TABS)[number]

const STATUS_TONE: Record<GoldenPagesStatus, 'gold' | 'green' | 'red'> = {
  pending: 'gold',
  approved: 'green',
  declined: 'red',
}

function timeAgo(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  const units: [number, string][] = [
    [60, 'second'],
    [60, 'minute'],
    [24, 'hour'],
    [30, 'day'],
    [12, 'month'],
    [Number.POSITIVE_INFINITY, 'year'],
  ]
  let value = secs
  let unit = 'second'
  for (const [size, name] of units) {
    if (value < size) {
      unit = name
      break
    }
    value = Math.floor(value / size)
    unit = name
  }
  return `${value} ${unit}${value === 1 ? '' : 's'} ago`
}

export default async function AdminGoldenPagesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const tab: Tab = TABS.includes(status as Tab) ? (status as Tab) : 'pending'

  const supabase = await createClient()
  let query = supabase
    .from('golden_pages_profiles')
    .select(
      'id, business_name, service_type, city, state, status, created_at',
    )
    .order('created_at', { ascending: false })
  if (tab !== 'all') query = query.eq('status', tab)

  const { data } = await query
  const rows = (data ?? []) as Pick<
    GoldenPagesProfile,
    'id' | 'business_name' | 'service_type' | 'city' | 'state' | 'status' | 'created_at'
  >[]

  return (
    <Shell title="Golden Pages Listings">
      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map((t) => (
          <Link
            key={t}
            href={`/admin/golden-pages?status=${t}`}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm capitalize transition-colors',
              t === tab
                ? 'border-gold/50 bg-gold/10 text-gold-soft'
                : 'border-line text-cream-dim hover:text-cream',
            )}
          >
            {t}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <Card className="mt-6 border-dashed text-center">
          <p className="text-cream-dim">No {tab === 'all' ? '' : tab} listings.</p>
        </Card>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-ink-soft text-left text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Business</th>
                <th className="px-4 py-3 font-medium">Service</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-line hover:bg-ink-soft/50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/golden-pages/${r.id}`}
                      className="font-medium text-cream hover:text-gold"
                    >
                      {r.business_name ?? 'Unnamed business'}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-cream-dim">
                    {serviceTypeLabel(r.service_type)}
                  </td>
                  <td className="px-4 py-3 text-cream-dim">
                    {[r.city, r.state].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="px-4 py-3 text-muted">{timeAgo(r.created_at)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[r.status]} className="capitalize">
                      {r.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Shell>
  )
}
