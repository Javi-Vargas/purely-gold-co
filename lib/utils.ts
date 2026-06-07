import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ProviderServiceType } from '@/types'

// Merge Tailwind class names, resolving conflicts.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Human-readable labels for the provider_service_type enum, shared by the
// Golden Pages directory, listing detail, and the listing editor.
export const SERVICE_TYPE_LABELS: Record<ProviderServiceType, string> = {
  photography: 'Photography',
  videography: 'Videography',
  agency: 'Creative Agency',
  production: 'Production Company',
  other: 'Other',
}

export function serviceTypeLabel(type: string | null | undefined): string {
  if (!type) return 'Business'
  return SERVICE_TYPE_LABELS[type as ProviderServiceType] ?? type
}
