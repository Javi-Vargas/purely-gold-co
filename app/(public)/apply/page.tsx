import { Button } from '@/components/ui/Button'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Input, Label, Textarea, Select } from '@/components/ui/Input'
import { submitApplication } from './actions'

export const metadata = { title: 'Apply to the Directory — Golden Pages' }

export default async function ApplyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const errorMessage =
    error === 'missing'
      ? 'Please fill in business name and email.'
      : error === 'server'
        ? 'Something went wrong submitting your application. Please try again.'
        : null

  return (
    <div className="mx-auto max-w-xl px-6 py-20">
      <Card>
        <CardTitle>Apply to the Directory</CardTitle>
        <CardDescription>
          For photographers, videographers, agencies, and production companies. Vetted
          before listing.
        </CardDescription>

        {errorMessage && (
          <p className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {errorMessage}
          </p>
        )}

        <form action={submitApplication} className="mt-6 space-y-4">
          {/* Honeypot — bots fill this, humans never see it */}
          <input
            type="text"
            name="_gotcha"
            tabIndex={-1}
            autoComplete="off"
            style={{ display: 'none' }}
          />
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input id="location" name="location" placeholder="City, State" />
            </div>
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
          <Button type="submit" className="w-full">
            Submit application
          </Button>
        </form>
      </Card>
    </div>
  )
}
