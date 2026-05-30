import { Badge } from '@/components/ui/Badge'
import type { Role } from '@/types'

const roleLabel: Record<Role, string> = {
  client: 'Client',
  provider: 'Service Provider',
  golden_pages: 'Golden Pages',
  admin: 'Admin',
}

export function Topbar({ title, role }: { title: string; role: Role }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-line px-8">
      <h1 className="font-display text-2xl font-medium text-cream">{title}</h1>
      <Badge tone="gold">{roleLabel[role]}</Badge>
    </header>
  )
}
