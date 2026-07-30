export type AmPm = 'AM' | 'PM'

export interface BusinessHoursInput {
  days: number[] // 0 = Sun … 6 = Sat, any order, may contain dupes
  startHour: number | null
  startAmPm: AmPm | null
  endHour: number | null
  endAmPm: AmPm | null
}

const DAY_ABBRS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

function formatTime(hour: number | null, ampm: AmPm | null): string | null {
  if (hour === null || ampm === null) return null
  if (!Number.isInteger(hour) || hour < 1 || hour > 12) return null
  return `${hour}${ampm.toLowerCase()}`
}

// Builds the stored business-hours string, e.g. "Mon, Tue, Wed 9am–6pm".
// Returns null when the input is incomplete (no days, or either time missing
// / out of range) so the caller can treat it as a validation failure.
export function formatBusinessHours(input: BusinessHoursInput): string | null {
  const days = Array.from(new Set(input.days))
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
    .sort((a, b) => a - b)
  if (days.length === 0) return null

  const start = formatTime(input.startHour, input.startAmPm)
  const end = formatTime(input.endHour, input.endAmPm)
  if (start === null || end === null) return null

  const dayList = days.map((d) => DAY_ABBRS[d]).join(', ')
  return `${dayList} ${start}–${end}`
}
