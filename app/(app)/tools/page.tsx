import Link from 'next/link'
import { Shell } from '@/components/layout/Shell'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
  PenLine,
  CalendarRange,
  Camera,
  Type,
  Calculator,
  Palette,
} from 'lucide-react'

const TOOLS = [
  { href: '/tools/brief', name: 'Campaign Brief Builder', icon: PenLine, desc: 'Turn a rough idea into a complete creative brief.' },
  { href: '/tools/strategy', name: 'Content Strategy Generator', icon: CalendarRange, desc: 'A platform-by-platform content calendar.' },
  { href: '/tools/shot-list', name: 'Shot List Generator', icon: Camera, desc: 'A detailed shoot list from your deliverables.' },
  { href: '/tools/copy', name: 'Caption & Copy Writer', icon: Type, desc: 'Campaign copy across formats and platforms.' },
  { href: '/tools/budget', name: 'Budget Planner', icon: Calculator, desc: 'Itemised production cost estimates.' },
  { href: '/tools/mood-board', name: 'Mood Board Generator', icon: Palette, desc: 'Written visual direction and palette.' },
]

export default function ToolsHubPage() {
  return (
    <Shell title="AI Tools">
      <p className="mb-8 max-w-2xl text-cream-dim">
        Six tools to plan and build a complete campaign — included with your subscription.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map(({ href, name, icon: Icon, desc }) => (
          <Link key={href} href={href}>
            <Card className="h-full transition-colors hover:border-gold/50">
              <div className="flex items-center justify-between">
                <Icon className="text-gold" size={22} />
                <Badge tone="gold">Included</Badge>
              </div>
              <h3 className="mt-4 font-medium text-cream">{name}</h3>
              <p className="mt-1 text-sm text-cream-dim">{desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </Shell>
  )
}
