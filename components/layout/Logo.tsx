import Link from 'next/link'
import { cn } from '@/lib/utils'

export function Logo({ href = '/', className }: { href?: string; className?: string }) {
  return (
    <Link
      href={href}
      className={cn('group inline-flex items-baseline gap-1.5', className)}
    >
      <span className="font-display text-2xl font-semibold tracking-tight text-cream">
        Golden
      </span>
      <span className="font-display text-2xl font-semibold tracking-tight text-gold">
        Network
      </span>
    </Link>
  )
}
