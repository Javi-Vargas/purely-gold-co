import { requireUser } from '@/lib/auth'
import { Topbar } from './Topbar'

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
  await requireUser()
  return (
    <>
      <Topbar title={title} role="admin" />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </>
  )
}
