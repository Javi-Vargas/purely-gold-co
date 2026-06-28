import Link from 'next/link'
import { Shell } from '@/components/layout/Shell'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'

const sections = [
  {
    href: '/admin/golden-pages',
    title: 'Golden Pages',
    desc: 'Review listing requests — approve, decline, or unpublish.',
  },
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
