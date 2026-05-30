// Shared TypeScript types for Purely GOLD Co.

export type Role = 'client' | 'provider' | 'golden_pages' | 'admin'

export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled'
export type ProviderServiceType =
  | 'photography'
  | 'videography'
  | 'agency'
  | 'production'
  | 'other'
export type ProviderApplicationStatus =
  | 'pending'
  | 'auto_screened'
  | 'approved'
  | 'declined'
export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'in_progress'
  | 'delivered'
  | 'revision_requested'
  | 'complete'
  | 'cancelled'
export type ApplicationStatus =
  | 'submitted'
  | 'auto_review'
  | 'admin_review'
  | 'approved'
  | 'declined'
export type AiTool =
  | 'brief_builder'
  | 'content_strategy'
  | 'shot_list'
  | 'caption_copy'
  | 'budget_planner'
  | 'mood_board'

export interface ClientProfile {
  id: string
  user_id: string
  business_name: string | null
  contact_name: string | null
  industry: string | null
  bio: string | null
  avatar_url: string | null
  subscription_status: SubscriptionStatus
  paypal_customer_id: string | null
  created_at: string
}

export interface ProviderProfile {
  id: string
  user_id: string
  business_name: string | null
  contact_name: string | null
  service_type: ProviderServiceType | null
  location: string | null
  bio: string | null
  portfolio_urls: string[]
  listing_fee_paid: boolean
  application_status: ProviderApplicationStatus
  paypal_account_email: string | null
  created_at: string
}

export interface GoldenPagesProfile {
  id: string
  user_id: string
  business_name: string | null
  service_type: ProviderServiceType | null
  contact_name: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  website_url: string | null
  business_hours: string | null
  bio: string | null
  logo_url: string | null
  subscription_status: SubscriptionStatus
  paypal_customer_id: string | null
  is_visible: boolean
  created_at: string
}

export interface ProviderPackage {
  id: string
  provider_id: string
  title: string
  description: string | null
  price: number // cents
  delivery_days: number | null
  revisions: number | null
  is_active: boolean
  created_at: string
}

export interface Order {
  id: string
  client_id: string
  provider_id: string
  package_id: string | null
  title: string | null
  brief: string | null
  status: OrderStatus
  amount_paid: number | null // cents
  paypal_order_id: string | null
  deadline: string | null
  delivered_at: string | null
  completed_at: string | null
  created_at: string
}

export interface Revision {
  id: string
  order_id: string
  requested_by: string | null
  note: string | null
  created_at: string
}

export interface Message {
  id: string
  order_id: string
  sender_id: string | null
  content: string
  read: boolean
  created_at: string
}

export interface ProviderApplication {
  id: string
  user_id: string | null
  business_name: string | null
  service_type: string | null
  location: string | null
  website_url: string | null
  portfolio_url: string | null
  instagram_url: string | null
  years_experience: number | null
  description: string | null
  auto_screen_score: number | null
  auto_screen_flags: string[]
  admin_notes: string | null
  status: ApplicationStatus
  submitted_at: string
  reviewed_at: string | null
}

export interface Review {
  id: string
  order_id: string
  client_id: string
  provider_id: string
  rating: number
  comment: string | null
  created_at: string
}

export interface ToolOutput {
  id: string
  user_id: string
  tool: AiTool
  title: string | null
  input_params: Record<string, unknown> | null
  output_content: string | null
  is_saved: boolean
  created_at: string
}

// Minimal shape of the authenticated user we care about in app code.
export interface SessionUser {
  id: string
  email?: string
  role: Role | null
}
