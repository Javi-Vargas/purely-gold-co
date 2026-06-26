import Link from 'next/link'
import { Logo } from './Logo'

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line/60 bg-ink">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between">
        <Logo />
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-cream-dim">
          <Link href="/about" className="hover:text-cream">
            About
          </Link>
          <Link href="/golden-pages" className="hover:text-cream">
            Business Directory
          </Link>
          <Link href="/get-listed" className="hover:text-cream">
            Get Listed
          </Link>
        </div>
        <p className="text-xs text-muted">
          © {new Date().getFullYear()} PurelyGoldenLLC
        </p>
      </div>
    </footer>
  )
}
