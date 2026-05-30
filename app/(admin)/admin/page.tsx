import Link from 'next/link'
import { Shell } from '@/components/layout/Shell'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'

const sections = [
  { href: '/admin/applications', title: 'Applications', desc: 'Review the provider vetting queue.' },
  { href: '/admin/golden-pages', title: 'Golden Pages', desc: 'Approve, hide, or edit public listings.' },
  { href: '/admin/users', title: 'Users', desc: 'All users across roles.' },
  { href: '/admin/orders', title: 'Orders', desc: 'All orders on the platform.' },
  { href: '/admin/providers', title: 'Providers', desc: 'All approved providers.' },
]

export default function AdminOverview() {
  return (
    <Shell title="Admin Overview">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => (
          <Link key={s.href} href={s.href}>
            <Card className="h-full transition-colors hover:border-gold/50">
              <CardTitle className="text-xl">{s.title}</CardTitle>
              <CardDescription>{s.desc}</CardDescription>
            </Card>
          </Link>
        ))}
      </div>
    </Shell>
  )
}
