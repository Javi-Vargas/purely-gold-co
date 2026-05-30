// PayPal integration — STUBBED for the Week 1-2 Foundation sprint.
//
// TODO (payments sprint, Week 11-12): replace these stubs with real PayPal REST
// calls — $5/mo client subscription, one-time provider listing fee, Golden Pages
// subscription, payouts, and a webhook handler with signature verification.
//
// For now signup skips checkout entirely: the handle_new_user() DB trigger marks
// client / golden_pages profiles as subscription_status = 'active' so the app is
// usable without any PayPal setup.

export interface StubResult {
  ok: true
  stub: true
  note: string
}

export async function createClientSubscription(): Promise<StubResult> {
  return { ok: true, stub: true, note: 'PayPal stubbed — client marked active by DB trigger' }
}

export async function createProviderListingOrder(): Promise<StubResult> {
  return { ok: true, stub: true, note: 'PayPal stubbed — listing fee not collected yet' }
}

export async function createGoldenPagesSubscription(): Promise<StubResult> {
  return { ok: true, stub: true, note: 'PayPal stubbed — golden pages marked active by DB trigger' }
}
