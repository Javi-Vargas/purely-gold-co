'use client'

import { useState } from 'react'
import { Label, Select } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

const DAYS = [
  { value: 0, label: 'Sun', name: 'Sunday' },
  { value: 1, label: 'Mon', name: 'Monday' },
  { value: 2, label: 'Tue', name: 'Tuesday' },
  { value: 3, label: 'Wed', name: 'Wednesday' },
  { value: 4, label: 'Thu', name: 'Thursday' },
  { value: 5, label: 'Fri', name: 'Friday' },
  { value: 6, label: 'Sat', name: 'Saturday' },
]

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1)

export function BusinessHoursPicker() {
  const [selectedDays, setSelectedDays] = useState<number[]>([])

  function toggleDay(value: number) {
    setSelectedDays((prev) =>
      prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value],
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Business hours</Label>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Days open">
          {DAYS.map((day) => {
            const active = selectedDays.includes(day.value)
            return (
              <button
                key={day.value}
                type="button"
                onClick={() => toggleDay(day.value)}
                aria-label={day.name}
                aria-pressed={active}
                className={cn(
                  'flex h-11 w-11 items-center justify-center rounded-full border text-xs font-medium transition-colors',
                  active
                    ? 'border-gold bg-gold text-ink'
                    : 'border-line bg-ink-soft text-cream-dim hover:border-gold/50',
                )}
              >
                {day.label}
              </button>
            )
          })}
        </div>
        {selectedDays.map((value) => (
          <input key={value} type="hidden" name="day" value={value} />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="start_hour">From</Label>
          <div className="flex gap-2">
            <Select id="start_hour" name="start_hour" defaultValue="" aria-label="Opening hour">
              <option value="" disabled>
                Hour
              </option>
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </Select>
            <Select name="start_ampm" defaultValue="" aria-label="Opening AM or PM">
              <option value="" disabled>
                AM/PM
              </option>
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="end_hour">To</Label>
          <div className="flex gap-2">
            <Select id="end_hour" name="end_hour" defaultValue="" aria-label="Closing hour">
              <option value="" disabled>
                Hour
              </option>
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </Select>
            <Select name="end_ampm" defaultValue="" aria-label="Closing AM or PM">
              <option value="" disabled>
                AM/PM
              </option>
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}
