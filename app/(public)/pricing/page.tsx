import Link from 'next/link'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Check } from 'lucide-react'

export const metadata = { title: 'Pricing — Purely GOLD Co.' }

const tiers = [
  {
    name: 'Client',
    price: '$5',
    cadence: '/month',
    desc: 'All six AI tools + full vendor directory access.',
    features: ['All 6 AI campaign tools', 'Browse & hire vetted vendors', 'Order management & messaging', 'Saved tool outputs'],
    href: '/signup?role=client',
    cta: 'Request Access',
    featured: true,
  },
  {
    name: 'Golden Pages',
    price: 'TBD',
    cadence: '/month',
    desc: 'A public-facing business listing — be found without the full order flow.',
    features: ['Public directory listing', 'Contact, hours, website', 'No packages or orders'],
    href: '/signup?role=golden_pages',
    cta: 'List my business',
    featured: false,
  },
  {
    name: 'Service Provider',
    price: 'One-time',
    cadence: ' listing fee',
    desc: 'Vetted photographers, videographers, agencies & production companies.',
    features: ['Application + vetting', 'Profile & service packages', 'Receive & deliver orders', 'Earnings & payouts'],
    href: '/apply',
    cta: 'Apply to the Directory',
    featured: false,
  },
]

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <h1 className="text-center font-display text-5xl font-medium text-cream">
        Pricing
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-center text-cream-dim">
        Simple and transparent. Clients get everything for $5/month.
      </p>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {tiers.map((t) => (
          <Card
            key={t.name}
            className={t.featured ? 'border-gold/50 ring-1 ring-gold/30' : ''}
          >
            <CardTitle className="text-2xl">{t.name}</CardTitle>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="font-display text-4xl text-gold">{t.price}</span>
              <span className="text-sm text-muted">{t.cadence}</span>
            </div>
            <CardDescription>{t.desc}</CardDescription>
            <ul className="mt-6 space-y-2">
              {t.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-cream-dim">
                  <Check size={16} className="text-gold" /> {f}
                </li>
              ))}
            </ul>
            <Link href={t.href} className="mt-8 block">
              <Button variant={t.featured ? 'primary' : 'secondary'} className="w-full">
                {t.cta}
              </Button>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  )
}
