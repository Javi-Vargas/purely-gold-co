// Shared TypeScript types for Golden Pages.

export type Role = 'admin'

export type ProviderServiceType =
  | 'photography'
  | 'videography'
  | 'agency'
  | 'production'
  | 'other'

export type GoldenPagesStatus = 'pending' | 'approved' | 'declined'

export interface GoldenPagesProfile {
  id: string
  business_name: string | null
  service_type: ProviderServiceType | null
  contact_name: string | null
  email: string | null
  phone: string | null
  city: string | null
  state: string | null
  website_url: string | null
  business_hours: string | null
  bio: string | null
  is_visible: boolean
  status: GoldenPagesStatus
  admin_notes: string | null
  decline_reason: string | null
  reviewed_at: string | null
  reviewed_by: string | null
  created_at: string
}

// Minimal shape of the authenticated user we care about in app code.
export interface SessionUser {
  id: string
  email?: string
  role: Role | null
}
