import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

export const metadata = { title: 'Request received — Golden Pages' }

export default function GetListedThanksPage() {
  return (
    <div className="mx-auto max-w-xl px-6 py-28 text-center">
      <CheckCircle2 className="mx-auto text-gold" size={40} />
      <h1 className="mt-6 font-display text-5xl font-medium text-cream">
        Request received
      </h1>
      <p className="mx-auto mt-4 max-w-md text-cream-dim">
        Thanks for submitting your business. We review every request — once approved, your
        listing will appear in the Golden Pages directory.
      </p>
      <Link href="/golden-pages" className="mt-8 inline-block">
        <Button>
          View the Directory <ArrowRight size={16} />
        </Button>
      </Link>
    </div>
  )
}
