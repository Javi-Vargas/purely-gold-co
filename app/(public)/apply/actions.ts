'use server'

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendAdminNewListingNotification, sendBusinessConfirmation } from '@/lib/email'

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key)
  const s = typeof v === 'string' ? v.trim() : ''
  return s === '' ? null : s
}

// TEMPORARY: the /apply form is an alternate intake *format* under evaluation. It
// writes to the SAME vetting table as /get-listed (golden_pages_profiles) so both
// land in /admin/golden-pages and the owner can compare formats. Once they pick
// one, the other route + action is deleted.
export async function submitApplication(formData: FormData) {
  if (str(formData, '_gotcha')) redirect('/get-listed/thanks')

  const business_name = str(formData, 'business_name')
  const email = str(formData, 'email')
  const service_type = str(formData, 'service_type')
  if (!business_name || !email) redirect('/apply?error=missing')

  // golden_pages_profiles has no portfolio/instagram/experience columns — fold the
  // provider-specific fields into the bio so the owner still sees them when reviewing.
  const extras = [
    str(formData, 'portfolio_url') && `Portfolio: ${str(formData, 'portfolio_url')}`,
    str(formData, 'instagram_url') && `Instagram: ${str(formData, 'instagram_url')}`,
    str(formData, 'years_experience') &&
      `Years experience: ${str(formData, 'years_experience')}`,
  ]
    .filter(Boolean)
    .join('\n')
  const bio = [str(formData, 'description'), extras].filter(Boolean).join('\n\n') || null

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('golden_pages_profiles')
    .insert({
      business_name,
      email,
      service_type,
      city: str(formData, 'location'),
      website_url: str(formData, 'website_url'),
      bio,
      status: 'pending',
      is_visible: false,
    })
    .select('id, business_name, service_type, city, state, email, website_url')
    .single()

  if (error || !data) {
    console.error('[apply] insert failed:', error)
    redirect('/apply?error=server')
  }

  await sendAdminNewListingNotification(data)
  await sendBusinessConfirmation(data)
  redirect('/get-listed/thanks')
}
