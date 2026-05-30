// Provider application auto-screen logic — PLACEHOLDER for a later sprint.
//
// TODO (provider sprint, Week 5-6): implement the scoring rules from spec §6
// (required fields, valid/reachable URLs, business-name length, years range,
// description word count, duplicate-email check), producing a 0-100 score and a
// list of red-flag strings used to pre-sort the admin review queue.

import type { ProviderApplication } from '@/types'

export interface AutoScreenResult {
  score: number
  flags: string[]
}

export function autoScreen(
  _application: Partial<ProviderApplication>,
): AutoScreenResult {
  // Placeholder: real scoring arrives in the provider sprint.
  return { score: 0, flags: [] }
}
