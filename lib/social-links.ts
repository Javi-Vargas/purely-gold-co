// Single source of truth for the social platforms captured on /get-listed.
// Pure data (no JSX) so server modules (submission guard, server action) can
// import SOCIAL_KEYS without pulling in icon/React code. Icons live in
// components/social/SocialIcon.tsx.

export type SocialKey = 'instagram_url' | 'tiktok_url' | 'youtube_url' | 'facebook_url'

export interface SocialPlatform {
  key: SocialKey
  label: string
  placeholder: string
}

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  { key: 'instagram_url', label: 'Instagram', placeholder: 'https://instagram.com/…' },
  { key: 'tiktok_url', label: 'TikTok', placeholder: 'https://tiktok.com/@…' },
  { key: 'youtube_url', label: 'YouTube', placeholder: 'https://youtube.com/@…' },
  { key: 'facebook_url', label: 'Facebook', placeholder: 'https://facebook.com/…' },
]

export const SOCIAL_KEYS: SocialKey[] = SOCIAL_PLATFORMS.map((p) => p.key)
