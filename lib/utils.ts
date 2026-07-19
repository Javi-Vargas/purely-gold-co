import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ProviderServiceType } from '@/types'

// Merge Tailwind class names, resolving conflicts.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Human-readable labels for the provider_service_type enum, shared by the
// directory, listing detail, the listing editor, and the get-listed dropdown.
//
// Typed as Record<ProviderServiceType, string> on purpose: the keys must be real
// enum values. Widening this to Record<string, string> lets an invalid key compile
// and then fail at insert time, which is exactly how the dropdown broke before.
export const SERVICE_TYPE_LABELS: Record<ProviderServiceType, string> = {
  photography: 'Photography',
  photographer: 'Photographer',
  videography: 'Videography',
  videographer: 'Videographer',
  video_editor: 'Video Editor',
  agency: 'Creative Agency',
  production: 'Production Company',
  other: 'Other',
  marketing_manager: 'Marketing Manager',
  brand_manager: 'Brand Manager',
  creative_director: 'Creative Director',
  producer: 'Producer',
  production_coordinator: 'Production Coordinator',
  project_manager: 'Project Manager',
  commercial_model: 'Commercial Model',
  fashion_model: 'Fashion Model',
  print_model: 'Print Model',
  actor: 'Actor',
  actress: 'Actress',
  voice_over_artist: 'Voice Over Artist',
  content_creator: 'Content Creator',
  ugc_creator: 'UGC Creator',
  influencer: 'Influencer',
  social_media_manager: 'Social Media Manager',
  community_manager: 'Community Manager',
  graphic_designer: 'Graphic Designer',
  web_designer: 'Web Designer',
  ux_ui_designer: 'UX/UI Designer',
  copywriter: 'Copywriter',
  brand_strategist: 'Brand Strategist',
  public_relations_professional: 'Public Relations Professional',
  media_buyer: 'Media Buyer',
  marketing_consultant: 'Marketing Consultant',
  photo_studio: 'Photo Studio',
  recording_studio: 'Recording Studio',
  event_producer: 'Event Producer',
  event_planner: 'Event Planner',
  makeup_artist: 'Makeup Artist',
  hair_stylist: 'Hair Stylist',
  fashion_stylist: 'Fashion Stylist',
  wardrobe_stylist: 'Wardrobe Stylist',
  casting_director: 'Casting Director',
  location_scout: 'Location Scout',
  drone_operator: 'Drone Operator',
  lighting_technician: 'Lighting Technician',
  audio_engineer: 'Audio Engineer',
  production_assistant: 'Production Assistant',
  printer_print_shop: 'Printer / Print Shop',
  signage_company: 'Signage Company',
}

export function serviceTypeLabel(type: string | null | undefined): string {
  if (!type) return 'Business'
  return SERVICE_TYPE_LABELS[type as ProviderServiceType] ?? type
}
