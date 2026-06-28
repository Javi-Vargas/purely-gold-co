import { getSessionUser } from '@/lib/auth'
import { Sidebar } from '@/components/layout/Sidebar'
import { AdminLogin } from '@/components/admin/AdminLogin'

// /admin self-gates: with no session (or a non-admin one) it renders the sign-in
// form in place rather than redirecting to a /login page. RLS is the real boundary
// for the data behind these pages.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser()

  if (!user) return <AdminLogin />
  if (user.role !== 'admin') return <AdminLogin notAdminEmail={user.email} />

  return (
    <div className="flex min-h-screen">
      <Sidebar role="admin" email={user.email} />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  )
}
