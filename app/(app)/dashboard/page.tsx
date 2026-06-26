import Link from 'next/link'
import { getSessionUser } from '@/lib/auth'
import { Shell } from '@/components/layout/Shell'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Sparkles, Search, ShoppingBag, Briefcase, IdCard, Store } from 'lucide-react'

const quickLinks = {
  client: [
    { href: '/tools/brief', label: 'Start a Campaign Brief', icon: Sparkles, primary: true },
    { href: '/tools', label: 'All AI Tools', icon: Sparkles },
    { href: '/browse', label: 'Browse Vendors', icon: Search },
    { href: '/orders', label: 'My Orders', icon: ShoppingBag },
  ],
  provider: [
    { href: '/jobs', label: 'Incoming Jobs', icon: Briefcase, primary: true },
    { href: '/profile/edit', label: 'Edit Profile & Packages', icon: IdCard },
  ],
  golden_pages: [
    { href: '/golden-pages/edit', label: 'Edit My Listing', icon: Store, primary: true },
  ],
  admin: [],
}

const intro = {
  client: 'Plan your campaign with the AI tools, then hire vetted pros when you’re ready.',
  provider: 'Manage incoming jobs, deliver work, and keep your profile sharp.',
  golden_pages: 'Keep your public Golden Pages listing up to date.',
  admin: '',
}

export default async function DashboardPage() {
  const user = await getSessionUser()
  const role = (user?.role ?? 'client') as keyof typeof quickLinks

  return (
    <Shell title="Dashboard">
      <div className="max-w-3xl">
        <h2 className="font-display text-3xl text-cream">Welcome to Golden Pages.</h2>
        <p className="mt-2 text-cream-dim">{intro[role]}</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {quickLinks[role].map(({ href, label, icon: Icon, primary }) => (
            <Link key={href} href={href}>
              <Card
                className={`flex items-center gap-4 transition-colors hover:border-gold/50 ${
                  primary ? 'border-gold/40' : ''
                }`}
              >
                <Icon className="text-gold" size={22} />
                <span className="font-medium text-cream">{label}</span>
              </Card>
            </Link>
          ))}
        </div>

        {role === 'client' && (
          <Card className="mt-6">
            <CardTitle className="text-xl">New here?</CardTitle>
            <CardDescription>
              The fastest path: turn a rough idea into a polished creative brief, then use
              it to brief vendors or your team.
            </CardDescription>
            <Link href="/tools/brief" className="mt-4 inline-block">
              <Button>Start with a Campaign Brief</Button>
            </Link>
          </Card>
        )}
      </div>
    </Shell>
  )
}
