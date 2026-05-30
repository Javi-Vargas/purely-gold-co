import { Card } from '@/components/ui/Card'

export const metadata = { title: 'About — Purely GOLD Co.' }

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="font-display text-5xl font-medium text-cream">About</h1>
      <p className="mt-6 text-lg text-cream-dim">
        Purely GOLD Co. is a two-layer campaign coordination platform built for
        businesses, brands, and creators who need to plan, build, and execute marketing
        campaigns — either independently using AI tools, or by hiring vetted production
        professionals through the platform.
      </p>
      <div className="mt-10 grid gap-6">
        <Card>
          <h2 className="font-display text-2xl text-cream">Why two layers</h2>
          <ul className="mt-4 space-y-2 text-cream-dim">
            <li>• AI tools deliver immediate value on signup — no waiting for vendors.</li>
            <li>• The vendor directory upgrades the experience when you’re ready to spend.</li>
            <li>• Each layer reinforces the other: tools help you prepare, vendors help you execute.</li>
          </ul>
        </Card>
        <Card>
          <h2 className="font-display text-2xl text-cream">By invitation</h2>
          <p className="mt-4 text-cream-dim">
            The platform is not open to everyone. Providers are vetted before they can
            list, and that curation is the point — quality over quantity.
          </p>
        </Card>
      </div>
    </div>
  )
}
