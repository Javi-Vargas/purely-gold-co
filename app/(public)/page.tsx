'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import {
  Sparkles,
  Users,
  PenLine,
  CalendarRange,
  Camera,
  Type,
  Calculator,
  Palette,
  ArrowRight,
} from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
}

const tools = [
  { icon: PenLine, name: 'Campaign Brief Builder', desc: 'A rough idea becomes a complete, professional creative brief.' },
  { icon: CalendarRange, name: 'Content Strategy Generator', desc: 'A platform-by-platform content calendar, week by week.' },
  { icon: Camera, name: 'Shot List Generator', desc: 'A detailed shoot list from campaign type and deliverables.' },
  { icon: Type, name: 'Caption & Copy Writer', desc: 'Captions, ad headlines, subject lines — on brand, on length.' },
  { icon: Calculator, name: 'Budget Planner', desc: 'Itemised production cost ranges before you hire anyone.' },
  { icon: Palette, name: 'Mood Board Generator', desc: 'Visual direction, palette, and styling notes to share.' },
]

const roles = [
  {
    title: 'I need campaign support',
    desc: 'Plan and build complete campaigns with AI tools, then hire vetted pros when you’re ready.',
    href: '/signup?role=client',
    cta: 'Request Access — $5/mo',
  },
  {
    title: 'I offer a service',
    desc: 'Apply to the curated directory of photographers, videographers, agencies, and production companies.',
    href: '/apply',
    cta: 'Apply to the Directory',
  },
  {
    title: 'List my business',
    desc: 'A lighter-weight public Golden Pages listing — be found without the full order flow.',
    href: '/signup?role=golden_pages',
    cta: 'List on Golden Pages',
  },
]

export default function LandingPage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              'radial-gradient(60% 50% at 50% 0%, rgba(200,162,75,0.18) 0%, rgba(14,15,16,0) 70%)',
          }}
        />
        <div className="mx-auto max-w-4xl px-6 py-28 text-center">
          <motion.div initial="hidden" animate="show" variants={fadeUp} custom={0}>
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-gold-soft">
              By invitation
            </span>
          </motion.div>
          <motion.h1
            initial="hidden"
            animate="show"
            variants={fadeUp}
            custom={1}
            className="mt-8 font-display text-6xl font-medium leading-[1.05] text-cream md:text-7xl"
          >
            Campaigns, coordinated.
            <br />
            <span className="text-gold">Production, on demand.</span>
          </motion.h1>
          <motion.p
            initial="hidden"
            animate="show"
            variants={fadeUp}
            custom={2}
            className="mx-auto mt-6 max-w-2xl text-lg text-cream-dim"
          >
            Plan, build, and execute marketing campaigns — independently with six AI
            tools, or by hiring vetted production professionals through the platform.
          </motion.p>
          <motion.p
            initial="hidden"
            animate="show"
            variants={fadeUp}
            custom={3}
            className="mt-4 text-sm text-muted"
          >
            The platform is not open to everyone. That exclusivity is the product.
          </motion.p>
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            custom={4}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <Link href="/signup?role=client">
              <Button size="lg">
                Request Access <ArrowRight size={18} />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="secondary">
                See Pricing
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Two layers */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <Sparkles className="text-gold" />
            <CardTitle className="mt-4">Layer 1 — AI Campaign Tools</CardTitle>
            <CardDescription>
              Six AI-powered tools included with every subscription. Plan and build a
              complete campaign on your own — real value from day one, no vendor required.
            </CardDescription>
          </Card>
          <Card>
            <Users className="text-gold" />
            <CardTitle className="mt-4">Layer 2 — Vendor Directory</CardTitle>
            <CardDescription>
              A curated, vetted directory of photographers, videographers, agencies, and
              production companies. Browse, hire, and manage orders end to end.
            </CardDescription>
          </Card>
        </div>
      </section>

      {/* Tools grid */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="font-display text-3xl font-medium text-cream">
          Six tools, included
        </h2>
        <p className="mt-2 text-cream-dim">Everything you need to plan a campaign before you spend a dollar on production.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map(({ icon: Icon, name, desc }) => (
            <Card key={name} className="p-5">
              <Icon className="text-gold" size={22} />
              <h3 className="mt-3 font-medium text-cream">{name}</h3>
              <p className="mt-1 text-sm text-cream-dim">{desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Role CTAs */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {roles.map((r) => (
            <Card key={r.title} className="flex flex-col">
              <CardTitle className="text-xl">{r.title}</CardTitle>
              <CardDescription className="flex-1">{r.desc}</CardDescription>
              <Link href={r.href} className="mt-6">
                <Button variant="secondary" className="w-full">
                  {r.cta}
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
