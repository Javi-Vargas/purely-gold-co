'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'
import { sendApprovalEmail, sendDeclineEmail } from '@/lib/email'

const REVIEW_SELECT = 'id, business_name, service_type, city, state, email, website_url, instagram_url, tiktok_url, youtube_url, facebook_url'

export async function approveListing(formData: FormData) {
  const admin = await requireRole('admin')
  const id = String(formData.get('id') ?? '')
  if (!id) redirect('/admin/golden-pages')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('golden_pages_profiles')
    .update({
      status: 'approved',
      is_visible: true,
      decline_reason: null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: admin.id,
    })
    .eq('id', id)
    .select(REVIEW_SELECT)
    .single()

  if (error || !data) {
    console.error('[admin] approve failed:', error)
    redirect(`/admin/golden-pages/${id}?error=1`)
  }

  await sendApprovalEmail(data)
  revalidatePath('/admin/golden-pages')
  revalidatePath('/golden-pages')
  redirect('/admin/golden-pages')
}

export async function declineListing(formData: FormData) {
  const admin = await requireRole('admin')
  const id = String(formData.get('id') ?? '')
  if (!id) redirect('/admin/golden-pages')

  const reason = String(formData.get('reason') ?? '').trim() || null
  const note = String(formData.get('admin_notes') ?? '').trim() || null

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('golden_pages_profiles')
    .update({
      status: 'declined',
      is_visible: false,
      decline_reason: reason,
      admin_notes: note,
      reviewed_at: new Date().toISOString(),
      reviewed_by: admin.id,
    })
    .eq('id', id)
    .select(REVIEW_SELECT)
    .single()

  if (error || !data) {
    console.error('[admin] decline failed:', error)
    redirect(`/admin/golden-pages/${id}?error=1`)
  }

  await sendDeclineEmail(data, reason)
  revalidatePath('/admin/golden-pages')
  revalidatePath('/golden-pages')
  redirect('/admin/golden-pages')
}

// Show/hide an already-approved listing in the public directory without changing
// its approval status or sending any email. (Public visibility needs both
// status = 'approved' AND is_visible = true.)
export async function setVisibility(formData: FormData) {
  await requireRole('admin')
  const id = String(formData.get('id') ?? '')
  if (!id) redirect('/admin/golden-pages')
  const visible = formData.get('visible') === 'true'

  const supabase = await createClient()
  const { error } = await supabase
    .from('golden_pages_profiles')
    .update({ is_visible: visible })
    .eq('id', id)

  if (error) {
    console.error('[admin] visibility update failed:', error)
    redirect(`/admin/golden-pages/${id}?error=1`)
  }

  revalidatePath('/admin/golden-pages')
  revalidatePath('/golden-pages')
  redirect(`/admin/golden-pages/${id}`)
}

// Move a declined (or approved) listing back into the pending queue for another
// look. Clears the prior decision; sends no email.
export async function markPending(formData: FormData) {
  await requireRole('admin')
  const id = String(formData.get('id') ?? '')
  if (!id) redirect('/admin/golden-pages')

  const supabase = await createClient()
  const { error } = await supabase
    .from('golden_pages_profiles')
    .update({
      status: 'pending',
      is_visible: false,
      decline_reason: null,
      reviewed_at: null,
      reviewed_by: null,
    })
    .eq('id', id)

  if (error) {
    console.error('[admin] mark pending failed:', error)
    redirect(`/admin/golden-pages/${id}?error=1`)
  }

  revalidatePath('/admin/golden-pages')
  revalidatePath('/golden-pages')
  redirect('/admin/golden-pages')
}
