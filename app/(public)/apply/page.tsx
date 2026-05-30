'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Input, Label, Textarea, Select } from '@/components/ui/Input'
import { CheckCircle2 } from 'lucide-react'

export default function ApplyPage() {
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const form = new FormData(e.currentTarget)

    const supabase = createClient()
    const { error: insertError } = await supabase.from('provider_applications').insert({
      business_name: String(form.get('business_name') || ''),
      service_type: String(form.get('service_type') || ''),
      location: String(form.get('location') || ''),
      website_url: String(form.get('website_url') || ''),
      portfolio_url: String(form.get('portfolio_url') || ''),
      instagram_url: String(form.get('instagram_url') || ''),
      years_experience: form.get('years_experience')
        ? Number(form.get('years_experience'))
        : null,
      description: String(form.get('description') || ''),
      // status defaults to 'submitted'; user_id is null for public applications.
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }
    setSubmitted(true)
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <CheckCircle2 className="mx-auto text-gold" size={48} />
        <h1 className="mt-6 font-display text-4xl font-medium text-cream">
          Application received
        </h1>
        <p className="mt-4 text-cream-dim">
          Thank you. Our team will review your application and follow up by email. If
          approved, you’ll receive a link to pay the one-time listing fee and set up your
          profile.
        </p>
        <Link href="/" className="mt-8 inline-block">
          <Button variant="secondary">Back to home</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-20">
      <Card>
        <CardTitle>Apply to the Directory</CardTitle>
        <CardDescription>
          For photographers, videographers, agencies, and production companies. Vetted
          before listing.
        </CardDescription>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="business_name">Business name</Label>
            <Input id="business_name" name="business_name" required />
          </div>
          <div>
            <Label htmlFor="service_type">Service type</Label>
            <Select id="service_type" name="service_type" required defaultValue="">
              <option value="" disabled>
                Select…
              </option>
              <option value="photography">Photography</option>
              <option value="videography">Videography</option>
              <option value="agency">Agency</option>
              <option value="production">Production</option>
              <option value="other">Other</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" placeholder="City, State" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="website_url">Website</Label>
              <Input id="website_url" name="website_url" type="url" placeholder="https://" />
            </div>
            <div>
              <Label htmlFor="years_experience">Years experience</Label>
              <Input id="years_experience" name="years_experience" type="number" min={0} max={60} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="portfolio_url">Portfolio URL</Label>
              <Input id="portfolio_url" name="portfolio_url" type="url" placeholder="https://" />
            </div>
            <div>
              <Label htmlFor="instagram_url">Instagram</Label>
              <Input id="instagram_url" name="instagram_url" placeholder="@handle or URL" />
            </div>
          </div>
          <div>
            <Label htmlFor="description">Tell us about your work</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="A few sentences about your business, style, and notable clients."
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Submitting…' : 'Submit application'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
