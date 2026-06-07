'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Label, Textarea, Select } from '@/components/ui/Input'
import { SERVICE_TYPE_LABELS } from '@/lib/utils'
import { CheckCircle2, Eye, EyeOff } from 'lucide-react'
import type { GoldenPagesProfile } from '@/types'

// Editor for the caller's own Golden Pages listing. Authorization is enforced by
// RLS ("gp: update own"); we update by the row id passed in from the server.
export function ListingForm({ profile }: { profile: GoldenPagesProfile }) {
  const router = useRouter()
  const [visible, setVisible] = useState(profile.is_visible)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSaved(false)
    const form = new FormData(e.currentTarget)

    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('golden_pages_profiles')
      .update({
        business_name: String(form.get('business_name') || '') || null,
        service_type: String(form.get('service_type') || '') || null,
        contact_name: String(form.get('contact_name') || '') || null,
        phone: String(form.get('phone') || '') || null,
        address: String(form.get('address') || '') || null,
        city: String(form.get('city') || '') || null,
        state: String(form.get('state') || '') || null,
        zip: String(form.get('zip') || '') || null,
        website_url: String(form.get('website_url') || '') || null,
        business_hours: String(form.get('business_hours') || '') || null,
        bio: String(form.get('bio') || '') || null,
        is_visible: visible,
      })
      .eq('id', profile.id)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }
    setSaved(true)
    setLoading(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <Card className="space-y-4">
        <div>
          <Label htmlFor="business_name">Business name</Label>
          <Input
            id="business_name"
            name="business_name"
            defaultValue={profile.business_name ?? ''}
            required
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="service_type">Service type</Label>
            <Select
              id="service_type"
              name="service_type"
              defaultValue={profile.service_type ?? ''}
            >
              <option value="" disabled>
                Select…
              </option>
              {Object.entries(SERVICE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="contact_name">Contact name</Label>
            <Input
              id="contact_name"
              name="contact_name"
              defaultValue={profile.contact_name ?? ''}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="bio">About your business</Label>
          <Textarea
            id="bio"
            name="bio"
            defaultValue={profile.bio ?? ''}
            placeholder="A few sentences about your work, style, and notable clients."
          />
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" defaultValue={profile.phone ?? ''} />
          </div>
          <div>
            <Label htmlFor="website_url">Website</Label>
            <Input
              id="website_url"
              name="website_url"
              type="url"
              placeholder="https://"
              defaultValue={profile.website_url ?? ''}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="business_hours">Business hours</Label>
          <Input
            id="business_hours"
            name="business_hours"
            placeholder="Mon–Fri 9am–6pm"
            defaultValue={profile.business_hours ?? ''}
          />
        </div>
        <div>
          <Label htmlFor="address">Street address</Label>
          <Input id="address" name="address" defaultValue={profile.address ?? ''} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="city">City</Label>
            <Input id="city" name="city" defaultValue={profile.city ?? ''} />
          </div>
          <div>
            <Label htmlFor="state">State</Label>
            <Input id="state" name="state" defaultValue={profile.state ?? ''} />
          </div>
          <div>
            <Label htmlFor="zip">ZIP</Label>
            <Input id="zip" name="zip" defaultValue={profile.zip ?? ''} />
          </div>
        </div>
      </Card>

      {/* Publish toggle */}
      <Card className="flex items-center justify-between">
        <div>
          <p className="font-medium text-cream">
            {visible ? 'Listing is public' : 'Listing is hidden'}
          </p>
          <p className="mt-1 text-sm text-cream-dim">
            {visible
              ? 'Your listing appears in the public Golden Pages directory.'
              : 'Publish to appear in the public directory.'}
          </p>
        </div>
        <Button
          type="button"
          variant={visible ? 'secondary' : 'primary'}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? (
            <>
              <EyeOff size={16} /> Unpublish
            </>
          ) : (
            <>
              <Eye size={16} /> Publish
            </>
          )}
        </Button>
      </Card>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {saved && (
        <p className="flex items-center gap-2 text-sm text-emerald-300">
          <CheckCircle2 size={16} /> Saved.
          {visible && (
            <Link
              href={`/golden-pages/${profile.id}`}
              className="text-gold hover:underline"
            >
              View public listing
            </Link>
          )}
        </p>
      )}

      <Button type="submit" disabled={loading}>
        {loading ? 'Saving…' : 'Save listing'}
      </Button>
    </form>
  )
}
