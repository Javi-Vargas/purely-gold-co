import Link from 'next/link'
import { Logo } from './Logo'
import { Button } from '@/components/ui/Button'

export function PublicNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-ink/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Logo />
        <div className="hidden items-center gap-8 text-sm text-cream-dim md:flex">
          <Link href="/about" className="hover:text-cream">
            About
          </Link>
          <Link href="/pricing" className="hover:text-cream">
            Pricing
          </Link>
          <Link href="/golden-pages" className="hover:text-cream">
            Golden Pages
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-cream-dim hover:text-cream">
            Log in
          </Link>
          <Link href="/signup">
            <Button size="sm">Request Access</Button>
          </Link>
        </div>
      </nav>
    </header>
  )
}
