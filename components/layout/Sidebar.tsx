'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Logo } from './Logo'
import type { Role } from '@/types'
import { Shield, Store, LogOut, type LucideIcon } from 'lucide-react'

type NavItem = { href: string; label: string; icon: LucideIcon }

const NAV: Record<Role, NavItem[]> = {
  admin: [
    { href: '/admin', label: 'Overview', icon: Shield },
    { href: '/admin/golden-pages', label: 'Golden Pages', icon: Store },
  ],
}

export function Sidebar({ role, email }: { role: Role; email?: string }) {
  const pathname = usePathname()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    // Full reload so the server re-renders without the session.
    window.location.assign('/admin')
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-line bg-ink-soft">
      <div className="border-b border-line px-6 py-5">
        <Logo href="/admin" />
      </div>
      <nav className="flex-1 space-y-1 px-3 py-5">
        {NAV[role].map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
                active
                  ? 'bg-gold/10 text-gold-soft'
                  : 'text-cream-dim hover:bg-ink-card hover:text-cream',
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-line px-3 py-4">
        {email && (
          <p className="truncate px-3 pb-2 text-xs text-muted" title={email}>
            {email}
          </p>
        )}
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-cream-dim transition-colors hover:bg-ink-card hover:text-cream"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
