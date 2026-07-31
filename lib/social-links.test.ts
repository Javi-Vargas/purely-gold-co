import { describe, expect, it } from 'vitest'
import { SOCIAL_PLATFORMS, SOCIAL_KEYS } from './social-links'

describe('SOCIAL_PLATFORMS', () => {
  it('lists the 4 platforms in the fixed order', () => {
    expect(SOCIAL_PLATFORMS.map((p) => p.label)).toEqual([
      'Instagram',
      'TikTok',
      'YouTube',
      'Facebook',
    ])
  })

  it('uses *_url column keys, all unique', () => {
    const keys = SOCIAL_PLATFORMS.map((p) => p.key)
    expect(keys).toEqual(['instagram_url', 'tiktok_url', 'youtube_url', 'facebook_url'])
    expect(new Set(keys).size).toBe(keys.length)
    for (const k of keys) expect(k.endsWith('_url')).toBe(true)
  })

  it('gives every platform a non-empty placeholder', () => {
    for (const p of SOCIAL_PLATFORMS) expect(p.placeholder.length).toBeGreaterThan(0)
  })

  it('SOCIAL_KEYS mirrors the platform keys', () => {
    expect(SOCIAL_KEYS).toEqual(SOCIAL_PLATFORMS.map((p) => p.key))
  })
})
