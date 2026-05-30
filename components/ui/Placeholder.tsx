import { Card } from './Card'

// Marks a page/section that is intentionally a shell this sprint.
export function Placeholder({
  note = 'This area is part of a later sprint. The route, navigation, and access control are wired up now.',
}: {
  note?: string
}) {
  return (
    <Card className="border-dashed text-center">
      <p className="text-sm text-cream-dim">{note}</p>
    </Card>
  )
}
