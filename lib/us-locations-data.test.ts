import { describe, expect, it } from 'vitest'
import { CITIES_BY_STATE } from './us-locations-data'

const CODES = Object.keys(CITIES_BY_STATE)

describe('CITIES_BY_STATE', () => {
  it('covers all 51 states (50 + DC)', () => {
    expect(CODES).toHaveLength(51)
    expect(CODES).toContain('DC')
    expect(CODES).toContain('CA')
  })

  it('gives every state at least one city', () => {
    for (const code of CODES) {
      expect(CITIES_BY_STATE[code].length, `${code} has no cities`).toBeGreaterThan(0)
    }
  })

  it('has no duplicate cities within a state', () => {
    for (const code of CODES) {
      const list = CITIES_BY_STATE[code]
      expect(new Set(list).size, `${code} has duplicates`).toBe(list.length)
    }
  })

  it('has no empty or untrimmed city names', () => {
    for (const code of CODES) {
      for (const city of CITIES_BY_STATE[code]) {
        expect(city).toBe(city.trim())
        expect(city.length).toBeGreaterThan(0)
      }
    }
  })

  it('sorts each state list alphabetically', () => {
    for (const code of CODES) {
      const list = CITIES_BY_STATE[code]
      const sorted = [...list].sort((a, b) => a.localeCompare(b))
      expect(list).toEqual(sorted)
    }
  })

  it('strips place-type suffixes (spot check California)', () => {
    // "... city" suffixes must be gone; multi-word names preserved.
    expect(CITIES_BY_STATE.CA).toContain('Los Angeles')
    expect(CITIES_BY_STATE.CA.some((c) => / city$/i.test(c))).toBe(false)
  })

  it('preserves proper-name "City"/"Town" endings (Carson City)', () => {
    expect(CITIES_BY_STATE.NV).toContain('Carson City')
    expect(CITIES_BY_STATE.NV).not.toContain('Carson')
  })

  it('cleans consolidated / borough city names', () => {
    expect(CITIES_BY_STATE.AK).toContain('Juneau')
    expect(CITIES_BY_STATE.AK).toContain('Sitka')
    expect(CITIES_BY_STATE.AK).toContain('Wrangell')
    expect(CITIES_BY_STATE.GA).toContain('Athens')
    expect(CITIES_BY_STATE.GA).toContain('Augusta')
    expect(CITIES_BY_STATE.KY).toContain('Lexington')
    expect(CITIES_BY_STATE.KY).toContain('Louisville')
    expect(CITIES_BY_STATE.TN).toContain('Nashville')
    expect(CITIES_BY_STATE.HI).toContain('Honolulu')
  })

  it('has no administrative-descriptor or fragment leftovers', () => {
    for (const list of Object.values(CITIES_BY_STATE)) {
      for (const c of list) {
        expect(c).not.toMatch(/ (borough|government|county|corporation|CDP)$/i)
        expect(c).not.toMatch(/ and$/)
      }
    }
  })

  it('has no mojibake or control characters', () => {
    const badChars = /[�\x00-\x1F\x7F]/
    for (const list of Object.values(CITIES_BY_STATE)) {
      for (const c of list) {
        expect(c).not.toMatch(badChars)
      }
    }
  })

  it('preserves accented city names', () => {
    expect(CITIES_BY_STATE.CO).toContain('Cañon City')
    expect(CITIES_BY_STATE.NM).toContain('Española')
  })
})
