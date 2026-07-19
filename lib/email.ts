import { Resend } from 'resend'
import { serviceTypeLabel } from '@/lib/utils'
import type { GoldenPagesProfile } from '@/types'

// Transactional email for the Golden Pages vetting flow, via Resend.
//
// Setup (env): RESEND_API_KEY, EMAIL_FROM (e.g. "Golden Pages <listings@purelygoldenco.com>"),
// ADMIN_EMAIL (owner inbox), NEXT_PUBLIC_APP_URL (for links in emails).
//
// NOTE: until the sending domain is verified in Resend, delivery only works to
// your own Resend account email. All sends are wrapped so a mail failure never
// breaks the database write — we log and continue.

const apiKey = process.env.RESEND_API_KEY
const FROM = process.env.EMAIL_FROM ?? 'Golden Pages <onboarding@resend.dev>'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

const resend = apiKey ? new Resend(apiKey) : null

// Escape user-supplied values before interpolating into email HTML — submissions
// are public and untrusted, so this prevents HTML/script injection into the
// emails the owner and businesses receive.
const esc = (s: string | null | undefined) =>
  String(s ?? '—')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

type Listing = Pick<
  GoldenPagesProfile,
  | 'id'
  | 'business_name'
  | 'service_type'
  | 'city'
  | 'state'
  | 'email'
  | 'website_url'
>

// The FROM address is send-only (no mailbox), so every email carries a Reply-To
// pointing at ADMIN_EMAIL — otherwise a recipient hitting Reply just bounces.
async function send(opts: { to: string; subject: string; html: string; bcc?: string }) {
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY not set — skipping "${opts.subject}" to ${opts.to}`)
    return
  }
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      ...(ADMIN_EMAIL ? { replyTo: ADMIN_EMAIL } : {}),
      ...opts,
    })
    if (error) console.error('[email] Resend error:', error)
  } catch (err) {
    console.error('[email] send failed:', err)
  }
}

function wrap(title: string, body: string) {
  return `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a;line-height:1.6">
    <h1 style="font-size:20px;margin:0 0 16px">${title}</h1>
    ${body}
    <p style="margin-top:32px;font-size:12px;color:#888">Golden Pages — Purely Golden LLC</p>
  </div>`
}

// 1. Owner notification on every new submission.
export async function sendAdminNewListingNotification(listing: Listing) {
  if (!ADMIN_EMAIL) {
    console.warn('[email] ADMIN_EMAIL not set — skipping admin notification')
    return
  }
  const location = [listing.city, listing.state].filter(Boolean).join(', ') || '—'
  await send({
    to: ADMIN_EMAIL,
    subject: `New Golden Pages application — ${listing.business_name ?? 'Unnamed business'}`,
    html: wrap('New listing request', `
      <p>A business submitted a Golden Pages listing request:</p>
      <ul>
        <li><strong>Business:</strong> ${esc(listing.business_name)}</li>
        <li><strong>Service type:</strong> ${esc(serviceTypeLabel(listing.service_type))}</li>
        <li><strong>Location:</strong> ${esc(location)}</li>
        <li><strong>Email:</strong> ${esc(listing.email)}</li>
        <li><strong>Website:</strong> ${esc(listing.website_url)}</li>
      </ul>
      <p><a href="${APP_URL}/admin/golden-pages/${listing.id}">Review this submission →</a></p>
    `),
  })
}

// 2. Business confirmation on submission.
export async function sendBusinessConfirmation(listing: Listing) {
  if (!listing.email) return
  await send({
    to: listing.email,
    subject: 'We received your Golden Pages application — Purely Golden',
    html: wrap('Application received', `
      <p>Thank you for applying to be listed on the Purely Golden — Golden Pages directory.</p>
      <p>Your listing is currently under review. You'll receive an email once a decision has
      been made, typically within 48 hours.</p>
    `),
  })
}

// 3. Approval notification.
export async function sendApprovalEmail(listing: Listing) {
  if (!listing.email) return
  await send({
    to: listing.email,
    subject: 'Your Golden Pages listing is live — Purely Golden',
    html: wrap('You&rsquo;re approved', `
      <p>Congratulations — your business has been approved and is now live on the Golden
      Pages directory.</p>
      <p><a href="${APP_URL}/golden-pages/${listing.id}">View your listing →</a></p>
    `),
  })
}

// 4. Decline notification (optional reason).
export async function sendDeclineEmail(listing: Listing, reason?: string | null) {
  if (!listing.email) return
  await send({
    to: listing.email,
    // Copy the owner inbox so declines leave a record of what was sent.
    ...(ADMIN_EMAIL ? { bcc: ADMIN_EMAIL } : {}),
    subject: 'Update on your Golden Pages application — Purely Golden',
    html: wrap('Application update', `
      <p>Thank you for your interest in the Golden Pages directory.</p>
      <p>After review, we're unable to approve your listing at this time.</p>
      ${reason ? `<p><strong>Reason:</strong> ${esc(reason)}</p>` : ''}
      <p>If you believe this was an error or would like to reapply, please contact us at
      ${esc(ADMIN_EMAIL ?? 'our team')}.</p>
    `),
  })
}
