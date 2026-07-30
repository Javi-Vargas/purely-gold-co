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
})
