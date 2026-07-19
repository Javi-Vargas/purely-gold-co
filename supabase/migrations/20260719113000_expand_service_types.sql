-- Expand provider_service_type beyond the original five production-only values.
--
-- The directory now covers marketing, media, and production roles — both
-- businesses (photo studio, signage company) and individual professionals
-- (actor, makeup artist, copywriter). The form builds its dropdown from
-- SERVICE_TYPE_LABELS in lib/utils.ts, so that map and this enum must agree:
-- a label without a matching enum value fails the insert at runtime.
--
-- Deliberately NOT added: creative_agency and production_company. The existing
-- `agency` and `production` already carry those exact labels, and duplicate
-- values would split one category across two enum members in the directory
-- filter. Postgres has no DROP VALUE, so redundant members are permanent.
--
-- ADD VALUE IF NOT EXISTS is idempotent, so re-running is safe. Additive only:
-- no existing row changes, and `photography` (the one live listing) is untouched.

alter type provider_service_type add value if not exists 'photographer';
alter type provider_service_type add value if not exists 'videographer';
alter type provider_service_type add value if not exists 'video_editor';

-- Marketing / management
alter type provider_service_type add value if not exists 'marketing_manager';
alter type provider_service_type add value if not exists 'brand_manager';
alter type provider_service_type add value if not exists 'creative_director';
alter type provider_service_type add value if not exists 'producer';
alter type provider_service_type add value if not exists 'production_coordinator';
alter type provider_service_type add value if not exists 'project_manager';

-- Talent
alter type provider_service_type add value if not exists 'commercial_model';
alter type provider_service_type add value if not exists 'fashion_model';
alter type provider_service_type add value if not exists 'print_model';
alter type provider_service_type add value if not exists 'actor';
alter type provider_service_type add value if not exists 'actress';
alter type provider_service_type add value if not exists 'voice_over_artist';

-- Content / social
alter type provider_service_type add value if not exists 'content_creator';
alter type provider_service_type add value if not exists 'ugc_creator';
alter type provider_service_type add value if not exists 'influencer';
alter type provider_service_type add value if not exists 'social_media_manager';
alter type provider_service_type add value if not exists 'community_manager';

-- Design / copy / strategy
alter type provider_service_type add value if not exists 'graphic_designer';
alter type provider_service_type add value if not exists 'web_designer';
alter type provider_service_type add value if not exists 'ux_ui_designer';
alter type provider_service_type add value if not exists 'copywriter';
alter type provider_service_type add value if not exists 'brand_strategist';
alter type provider_service_type add value if not exists 'public_relations_professional';
alter type provider_service_type add value if not exists 'media_buyer';
alter type provider_service_type add value if not exists 'marketing_consultant';

-- Facilities / events
alter type provider_service_type add value if not exists 'photo_studio';
alter type provider_service_type add value if not exists 'recording_studio';
alter type provider_service_type add value if not exists 'event_producer';
alter type provider_service_type add value if not exists 'event_planner';

-- Styling
alter type provider_service_type add value if not exists 'makeup_artist';
alter type provider_service_type add value if not exists 'hair_stylist';
alter type provider_service_type add value if not exists 'fashion_stylist';
alter type provider_service_type add value if not exists 'wardrobe_stylist';

-- Crew
alter type provider_service_type add value if not exists 'casting_director';
alter type provider_service_type add value if not exists 'location_scout';
alter type provider_service_type add value if not exists 'drone_operator';
alter type provider_service_type add value if not exists 'lighting_technician';
alter type provider_service_type add value if not exists 'audio_engineer';
alter type provider_service_type add value if not exists 'production_assistant';

-- Print / signage
alter type provider_service_type add value if not exists 'printer_print_shop';
alter type provider_service_type add value if not exists 'signage_company';