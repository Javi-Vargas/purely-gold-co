import { requireUser } from '@/lib/auth'
import { Topbar } from './Topbar'
import type { Role } from '@/types'

// Server component used by authenticated pages: renders the role badge topbar
// and a scrollable content area. Fetches the session so individual pages don't
// have to repeat the auth lookup.
export async function Shell({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  const user = await requireUser()
  const role: Role = user.role ?? 'client'
  return (
    <>
      <Topbar title={title} role={role} />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </>
  )
}
