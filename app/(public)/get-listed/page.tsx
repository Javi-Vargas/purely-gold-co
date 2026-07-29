import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Label, Textarea, Select } from '@/components/ui/Input'
import { BusinessHoursPicker } from '@/components/get-listed/BusinessHoursPicker'
import { SERVICE_TYPE_LABELS } from '@/lib/utils'
import { submitListing } from './actions'

export const metadata = { title: 'Get Listed — Golden Pages' }

export default async function GetListedPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const errorMessage =
    error === 'missing'
      ? 'Please fill in business name, contact name, email, and business hours.'
      : error === 'invalid'
        ? 'Please double-check your entries — one of the fields looks invalid or too long.'
        : error === 'duplicate'
          ? 'It looks like this business has already been submitted. We’ll be in touch.'
          : error === 'rate'
            ? 'Too many submissions from your connection. Please wait a little while and try again.'
            : error === 'server'
              ? 'Something went wrong submitting your request. Please try again.'
              : null

  return (
    <div className="mx-auto max-w-2xl px-6 py-20">
      <p className="text-xs uppercase tracking-[0.24em] text-gold-dim">Get Listed</p>
      <h1 className="mt-3 font-display text-5xl font-medium text-cream">
        Request a listing
      </h1>
      <div className="mt-4 h-px w-10 bg-gold" />
      <p className="mt-4 max-w-xl text-cream-dim">
        Tell us about your production business. We review every submission before it goes
        live in the Golden Pages directory.
      </p>

      {errorMessage && (
        <p className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {errorMessage}
        </p>
      )}

      <form action={submitListing} className="mt-10 space-y-6">
        {/* Honeypot — bots fill this, humans never see it */}
        <input
          type="text"
          name="_gotcha"
          tabIndex={-1}
          autoComplete="off"
          style={{ display: 'none' }}
        />

        <Card className="space-y-4">
          <div>
            <Label htmlFor="business_name">Business name</Label>
            <Input id="business_name" name="business_name" required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="service_type">Service type</Label>
              <Select id="service_type" name="service_type" defaultValue="" required>
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
              <Input id="contact_name" name="contact_name" required />
            </div>
          </div>
          <div>
            <Label htmlFor="bio">About your business</Label>
            <Textarea
              id="bio"
              name="bio"
              placeholder="A few sentences about your work, style, and notable clients."
            />
          </div>
        </Card>

        <Card className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" />
            </div>
          </div>
          <div>
            <Label htmlFor="website_url">Website</Label>
            <Input id="website_url" name="website_url" type="url" placeholder="https://" />
          </div>
          <BusinessHoursPicker />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" name="city" />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input id="state" name="state" />
            </div>
          </div>
        </Card>

        <Button type="submit">Submit request</Button>
      </form>
    </div>
  )
}
