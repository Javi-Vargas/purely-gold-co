'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Logo } from './Logo'
import type { Role } from '@/types'
import {
  LayoutDashboard,
  Sparkles,
  Bookmark,
  Search,
  ShoppingBag,
  Briefcase,
  DollarSign,
  IdCard,
  Shield,
  Users,
  FileText,
  Store,
  LogOut,
  type LucideIcon,
} from 'lucide-react'

type NavItem = { href: string; label: string; icon: LucideIcon }

const NAV: Record<Role, NavItem[]> = {
  client: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/tools', label: 'AI Tools', icon: Sparkles },
    { href: '/saved', label: 'Saved', icon: Bookmark },
    { href: '/browse', label: 'Browse Vendors', icon: Search },
    { href: '/orders', label: 'My Orders', icon: ShoppingBag },
    { href: '/account', label: 'Account', icon: IdCard },
  ],
  provider: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/jobs', label: 'Jobs', icon: Briefcase },
    { href: '/earnings', label: 'Earnings', icon: DollarSign },
    { href: '/profile/edit', label: 'Profile', icon: IdCard },
    { href: '/account', label: 'Account', icon: IdCard },
  ],
  golden_pages: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/golden-pages/edit', label: 'My Listing', icon: Store },
    { href: '/account', label: 'Account', icon: IdCard },
  ],
  admin: [
    { href: '/admin', label: 'Overview', icon: Shield },
    { href: '/admin/applications', label: 'Applications', icon: FileText },
    { href: '/admin/golden-pages', label: 'Golden Pages', icon: Store },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
    { href: '/admin/providers', label: 'Providers', icon: Briefcase },
  ],
}

export function Sidebar({ role, email }: { role: Role; email?: string }) {
  const pathname = usePathname()
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-line bg-ink-soft">
      <div className="border-b border-line px-6 py-5">
        <Logo href="/dashboard" />
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
