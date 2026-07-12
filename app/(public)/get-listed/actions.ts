'use server'

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { guardSubmission } from '@/lib/submission-guard'
import { sendAdminNewListingNotification, sendBusinessConfirmation } from '@/lib/email'

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key)
  const s = typeof v === 'string' ? v.trim() : ''
  return s === '' ? null : s
}

// Public "Get Listed" submission. No login: anonymous visitors have no INSERT
// policy, so we write the pending row with the service-role client. The row is
// always created as pending + hidden; only the admin can approve/publish it.
export async function submitListing(formData: FormData) {
  // Honeypot — bots fill this hidden field. Pretend success without writing.
  if (str(formData, '_gotcha')) redirect('/get-listed/thanks')

  const business_name = str(formData, 'business_name')
  const contact_name = str(formData, 'contact_name')
  const email = str(formData, 'email')
  const service_type = str(formData, 'service_type')

  // Minimal server-side validation (the form also marks these required).
  if (!business_name || !contact_name || !email) {
    redirect('/get-listed?error=missing')
  }

  // Rate limit, validate, and reject duplicates before touching the table.
  const guard = await guardSubmission(formData)
  if (!guard.ok) redirect(`/get-listed?error=${guard.error}`)

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('golden_pages_profiles')
    .insert({
      business_name,
      contact_name,
      email: guard.email,
      service_type,
      phone: str(formData, 'phone'),
      website_url: str(formData, 'website_url'),
      business_hours: str(formData, 'business_hours'),
      city: str(formData, 'city'),
      state: str(formData, 'state'),
      bio: str(formData, 'bio'),
      status: 'pending',
      is_visible: false,
    })
    .select('id, business_name, service_type, city, state, email, website_url')
    .single()

  if (error || !data) {
    console.error('[get-listed] insert failed:', error)
    redirect('/get-listed?error=server')
  }

  // Fire-and-forget notifications (each is internally try/catch'd).
  await sendAdminNewListingNotification(data)
  await sendBusinessConfirmation(data)

  redirect('/get-listed/thanks')
}
