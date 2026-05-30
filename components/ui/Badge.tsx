import { cn } from '@/lib/utils'
import type { HTMLAttributes } from 'react'

type Tone = 'gold' | 'neutral' | 'green' | 'red'

const tones: Record<Tone, string> = {
  gold: 'border-gold/40 bg-gold/10 text-gold-soft',
  neutral: 'border-line bg-ink-soft text-cream-dim',
  green: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  red: 'border-red-500/40 bg-red-500/10 text-red-300',
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
}

export function Badge({ className, tone = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium tracking-wide',
        tones[tone],
        className,
      )}
      {...props}
    />
  )
}
