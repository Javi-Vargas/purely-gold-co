// Shared TypeScript types for Golden Pages.

export type Role = 'admin'

// Mirrors the `provider_service_type` Postgres enum. Keep this union, the enum,
// and SERVICE_TYPE_LABELS in lib/utils.ts in sync — a label whose key is not a
// real enum value passes the build but fails the insert in front of an applicant.
export type ProviderServiceType =
  // Original production-only values
  | 'photography'
  | 'videography'
  | 'agency'
  | 'production'
  | 'other'
  // Media
  | 'photographer'
  | 'videographer'
  | 'video_editor'
  // Marketing / management
  | 'marketing_manager'
  | 'brand_manager'
  | 'creative_director'
  | 'producer'
  | 'production_coordinator'
  | 'project_manager'
  // Talent
  | 'commercial_model'
  | 'fashion_model'
  | 'print_model'
  | 'actor'
  | 'actress'
  | 'voice_over_artist'
  // Content / social
  | 'content_creator'
  | 'ugc_creator'
  | 'influencer'
  | 'social_media_manager'
  | 'community_manager'
  // Design / copy / strategy
  | 'graphic_designer'
  | 'web_designer'
  | 'ux_ui_designer'
  | 'copywriter'
  | 'brand_strategist'
  | 'public_relations_professional'
  | 'media_buyer'
  | 'marketing_consultant'
  // Facilities / events
  | 'photo_studio'
  | 'recording_studio'
  | 'event_producer'
  | 'event_planner'
  // Styling
  | 'makeup_artist'
  | 'hair_stylist'
  | 'fashion_stylist'
  | 'wardrobe_stylist'
  // Crew
  | 'casting_director'
  | 'location_scout'
  | 'drone_operator'
  | 'lighting_technician'
  | 'audio_engineer'
  | 'production_assistant'
  // Print / signage
  | 'printer_print_shop'
  | 'signage_company'

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
