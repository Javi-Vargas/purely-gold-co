import { requireUser } from '@/lib/auth'
import { Sidebar } from '@/components/layout/Sidebar'
import type { Role } from '@/types'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()
  const role: Role = user.role ?? 'client'
  return (
    <div className="flex min-h-screen">
      <Sidebar role={role} email={user.email} />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  )
}
