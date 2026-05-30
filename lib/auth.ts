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

// Redirects to /login when there is no session.
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  return user
}

// Redirects unauthorized users to their dashboard. Accepts a single role or list.
export async function requireRole(role: Role | Role[]): Promise<SessionUser> {
  const user = await requireUser()
  const allowed = Array.isArray(role) ? role : [role]
  if (!user.role || !allowed.includes(user.role)) redirect('/dashboard')
  return user
}

// Where each role lands after login / when hitting an unauthorized route.
export function dashboardPathForRole(role: Role | null): string {
  if (role === 'admin') return '/admin'
  return '/dashboard'
}
