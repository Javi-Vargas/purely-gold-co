'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Search, PhoneCall, Store, ArrowRight } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
}

const steps = [
  {
    icon: Search,
    title: 'Browse the directory',
    desc: 'Explore vetted production businesses by service type — photographers, videographers, agencies, and more.',
  },
  {
    icon: PhoneCall,
    title: 'Connect directly',
    desc: 'Call, visit a website, or stop by. You reach businesses directly — no account, no middleman.',
  },
  {
    icon: Store,
    title: 'Get listed',
    desc: 'Run a production business? Submit a request — once approved, your listing appears in the directory.',
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
              Production business directory
            </span>
          </motion.div>
          <motion.h1
            initial="hidden"
            animate="show"
            variants={fadeUp}
            custom={1}
            className="mt-8 font-display text-6xl font-medium leading-[1.05] text-cream md:text-7xl"
          >
            Find production businesses.
            <br />
            <span className="text-gold">Or get listed.</span>
          </motion.h1>
          <motion.p
            initial="hidden"
            animate="show"
            variants={fadeUp}
            custom={2}
            className="mx-auto mt-6 max-w-2xl text-lg text-cream-dim"
          >
            Golden Pages is a curated directory of production businesses. Browse listings
            and reach out directly — no account required.
          </motion.p>
          <motion.div
            initial="hidden"
            animate="show"
            variants={fadeUp}
            custom={3}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <Link href="/golden-pages">
              <Button size="lg">
                View the Directory <ArrowRight size={18} />
              </Button>
            </Link>
            <Link href="/get-listed">
              <Button size="lg" variant="secondary">
                Get Listed
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="font-display text-3xl font-medium text-cream">How it works</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, desc }) => (
            <Card key={title}>
              <Icon className="text-gold" />
              <CardTitle className="mt-4">{title}</CardTitle>
              <CardDescription>{desc}</CardDescription>
            </Card>
          ))}
        </div>
      </section>

      {/* Get listed banner */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <Card className="flex flex-col items-start gap-4 border-gold/20 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-medium text-cream">
              Run a production business?
            </h2>
            <p className="mt-2 max-w-xl text-sm text-cream-dim">
              Get your name, contact info, and website in front of clients looking for
              production services.
            </p>
          </div>
          <Link href="/get-listed" className="flex-shrink-0">
            <Button>
              Get Listed <ArrowRight size={16} />
            </Button>
          </Link>
        </Card>
      </section>
    </div>
  )
}
