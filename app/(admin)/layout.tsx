import { requireRole } from '@/lib/auth'
import { Sidebar } from '@/components/layout/Sidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole('admin')
  return (
    <div className="flex min-h-screen">
      <Sidebar role="admin" email={user.email} />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  )
}
