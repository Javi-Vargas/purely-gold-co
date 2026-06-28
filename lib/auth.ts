import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Role, SessionUser } from '@/types'

// Returns the current user (id, email, role) or null. Uses getClaims(), the
// recommended way to read/verify the session in server code.
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (!claims) return null

  const appMeta = (claims.app_metadata ?? {}) as { role?: Role }
  return {
    id: claims.sub as string,
    email: claims.email as string | undefined,
    role: appMeta.role ?? null,
  }
}

// Redirects to the admin sign-in (/admin) when there is no session. There is no
// public /login page — /admin self-gates and renders the only sign-in form.
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) redirect('/admin')
  return user
}

// Requires an admin (the only role). Non-admins are sent to /admin, which renders
// the sign-in / not-authorized view.
export async function requireRole(role: Role | Role[]): Promise<SessionUser> {
  const user = await requireUser()
  const allowed = Array.isArray(role) ? role : [role]
  if (!user.role || !allowed.includes(user.role)) redirect('/admin')
  return user
}
