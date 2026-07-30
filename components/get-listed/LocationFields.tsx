'use client'

import { useState, type ChangeEvent } from 'react'
import { Input, Label, Select } from '@/components/ui/Input'
import { US_STATES, citiesForState } from '@/lib/us-locations'

export function LocationFields() {
  const [state, setState] = useState('')
  const [city, setCity] = useState('')
  const [notListed, setNotListed] = useState(false)
  const [customCity, setCustomCity] = useState('')

  const cities = citiesForState(state)

  function onStateChange(e: ChangeEvent<HTMLSelectElement>) {
    setState(e.target.value)
    setCity('') // reset city when the state changes
    setCustomCity('')
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="state">State</Label>
          <Select id="state" name="state" required value={state} onChange={onStateChange}>
            <option value="" disabled>
              Select…
            </option>
            {US_STATES.map((s) => (
              <option key={s.code} value={s.code} aria-label={s.name}>
                {s.code}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="city">City</Label>
          <Select
            id="city"
            name="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            disabled={!state || notListed}
          >
            <option value="" disabled>
              Select…
            </option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm text-cream-dim">
          <input
            type="checkbox"
            checked={notListed}
            onChange={(e) => setNotListed(e.target.checked)}
            className="h-4 w-4 accent-gold"
          />
          My city is not listed
        </label>
        <Input
          name="city"
          value={customCity}
          onChange={(e) => setCustomCity(e.target.value)}
          disabled={!notListed}
          placeholder="Enter your city"
          aria-label="City name"
        />
      </div>
    </div>
  )
}
