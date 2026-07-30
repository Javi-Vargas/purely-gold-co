import { describe, expect, it } from 'vitest'
import {
  US_STATES,
  citiesForState,
  stateLabel,
  isValidStateCode,
} from './us-locations'

describe('US_STATES', () => {
  it('lists 51 states (50 + DC), sorted by code', () => {
    expect(US_STATES).toHaveLength(51)
    const codes = US_STATES.map((s) => s.code)
    expect(codes).toContain('DC')
    expect([...codes]).toEqual([...codes].sort())
  })
})

describe('citiesForState', () => {
  it('returns a non-empty list for a real state', () => {
    expect(citiesForState('CA').length).toBeGreaterThan(0)
  })
  it('returns [] for unknown, empty, null, or undefined', () => {
    expect(citiesForState('ZZ')).toEqual([])
    expect(citiesForState('')).toEqual([])
    expect(citiesForState(null)).toEqual([])
    expect(citiesForState(undefined)).toEqual([])
  })
})

describe('stateLabel', () => {
  it('returns the full name for a known code', () => {
    expect(stateLabel('FL')).toBe('Florida')
  })
  it('returns the input unchanged for an unknown value', () => {
    expect(stateLabel('Florida')).toBe('Florida')
  })
  it('returns empty string for empty/null/undefined', () => {
    expect(stateLabel('')).toBe('')
    expect(stateLabel(null)).toBe('')
    expect(stateLabel(undefined)).toBe('')
  })
})

describe('isValidStateCode', () => {
  it('accepts real codes and rejects junk', () => {
    expect(isValidStateCode('TX')).toBe(true)
    expect(isValidStateCode('DC')).toBe(true)
    expect(isValidStateCode('tx')).toBe(false)
    expect(isValidStateCode('ZZ')).toBe(false)
    expect(isValidStateCode('')).toBe(false)
  })
  it('rejects inherited Object properties (prototype-chain safety)', () => {
    expect(isValidStateCode('constructor')).toBe(false)
    expect(isValidStateCode('toString')).toBe(false)
    expect(isValidStateCode('hasOwnProperty')).toBe(false)
    expect(citiesForState('constructor')).toEqual([])
    expect(citiesForState('toString')).toEqual([])
    expect(stateLabel('constructor')).toBe('constructor')
  })
})
