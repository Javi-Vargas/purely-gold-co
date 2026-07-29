import { describe, expect, it } from 'vitest'
import { formatBusinessHours } from './business-hours'

describe('formatBusinessHours', () => {
  it('formats a weekday range as a comma list', () => {
    expect(
      formatBusinessHours({ days: [1, 2, 3, 4, 5], startHour: 9, startAmPm: 'AM', endHour: 6, endAmPm: 'PM' }),
    ).toBe('Mon, Tue, Wed, Thu, Fri 9am–6pm')
  })

  it('keeps non-contiguous days as a comma list', () => {
    expect(
      formatBusinessHours({ days: [1, 3, 5], startHour: 9, startAmPm: 'AM', endHour: 6, endAmPm: 'PM' }),
    ).toBe('Mon, Wed, Fri 9am–6pm')
  })

  it('orders days Sunday-first regardless of input order', () => {
    expect(
      formatBusinessHours({ days: [6, 0, 3], startHour: 8, startAmPm: 'AM', endHour: 4, endAmPm: 'PM' }),
    ).toBe('Sun, Wed, Sat 8am–4pm')
  })

  it('dedupes repeated days', () => {
    expect(
      formatBusinessHours({ days: [1, 1, 2], startHour: 9, startAmPm: 'AM', endHour: 5, endAmPm: 'PM' }),
    ).toBe('Mon, Tue 9am–5pm')
  })

  it('formats 12am and 12pm literally', () => {
    expect(
      formatBusinessHours({ days: [0], startHour: 12, startAmPm: 'AM', endHour: 12, endAmPm: 'PM' }),
    ).toBe('Sun 12am–12pm')
  })

  it('allows overnight ranges', () => {
    expect(
      formatBusinessHours({ days: [5], startHour: 9, startAmPm: 'PM', endHour: 2, endAmPm: 'AM' }),
    ).toBe('Fri 9pm–2am')
  })

  it('returns null when no days are selected', () => {
    expect(
      formatBusinessHours({ days: [], startHour: 9, startAmPm: 'AM', endHour: 6, endAmPm: 'PM' }),
    ).toBeNull()
  })

  it('returns null when the start time is incomplete', () => {
    expect(
      formatBusinessHours({ days: [1], startHour: null, startAmPm: 'AM', endHour: 6, endAmPm: 'PM' }),
    ).toBeNull()
  })

  it('returns null when the end time is incomplete', () => {
    expect(
      formatBusinessHours({ days: [1], startHour: 9, startAmPm: 'AM', endHour: 6, endAmPm: null }),
    ).toBeNull()
  })

  it('returns null for an out-of-range hour', () => {
    expect(
      formatBusinessHours({ days: [1], startHour: 0, startAmPm: 'AM', endHour: 6, endAmPm: 'PM' }),
    ).toBeNull()
  })
})
