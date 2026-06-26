'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Select, Input } from '@/components/ui/Input'
import { serviceTypeLabel, SERVICE_TYPE_LABELS } from '@/lib/utils'
import { Globe, Phone, Clock, MapPin, ArrowRight, Search, ChevronDown } from 'lucide-react'
import type { GoldenPagesProfile, ProviderServiceType } from '@/types'

export type DirectoryListing = Pick<
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

// Enum order, used to keep the dropdown stable regardless of listing order.
const SERVICE_TYPE_ORDER = Object.keys(SERVICE_TYPE_LABELS) as ProviderServiceType[]

export function DirectoryListings({ listings }: { listings: DirectoryListing[] }) {
  const [serviceType, setServiceType] = useState<string>('all')
  const [query, setQuery] = useState('')

  // Only offer types that actually have a listing, in enum order.
  const availableTypes = useMemo(() => {
    const present = new Set(listings.map((l) => l.service_type).filter(Boolean))
    return SERVICE_TYPE_ORDER.filter((t) => present.has(t))
  }, [listings])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return listings.filter((l) => {
      const typeOk = serviceType === 'all' || l.service_type === serviceType
      const nameOk = q === '' || (l.business_name ?? '').toLowerCase().includes(q)
      return typeOk && nameOk
    })
  }, [listings, serviceType, query])

  function clearFilters() {
    setServiceType('all')
    setQuery('')
  }

  return (
    <>
      {/* Count + list CTA */}
      <div className="mt-10 flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.1em] text-muted">
          {filtered.length} {filtered.length === 1 ? 'Listing' : 'Listings'}
        </span>
        <Link href="/get-listed">
          <Button size="sm">
            List My Business <ArrowRight size={16} />
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:w-56">
          <Select
            aria-label="Filter by service type"
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            className="pr-10"
          >
            <option value="all">All types</option>
            {availableTypes.map((t) => (
              <option key={t} value={t}>
                {serviceTypeLabel(t)}
              </option>
            ))}
          </Select>
          <ChevronDown
            size={16}
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted"
          />
        </div>

        <div className="relative sm:flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
          />
          <Input
            type="search"
            aria-label="Search by business name"
            placeholder="Search by name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Listings */}
      {listings.length === 0 ? (
        <Card className="mt-6 border-dashed text-center">
          <p className="text-cream-dim">
            No public listings yet. Businesses that join Golden Pages will appear here.
          </p>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="mt-6 border-dashed text-center">
          <p className="text-cream-dim">No listings match your filters.</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={clearFilters}>
            Clear filters
          </Button>
        </Card>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {filtered.map((l) => (
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
    </>
  )
}
