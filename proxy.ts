import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Role } from '@/types'

// Next.js 16 renamed `middleware` -> `proxy`. This runs on every matched request:
// it refreshes the Supabase session cookies and enforces role-based access.
//
// Security note: RLS in the database is the real boundary (see migration). This
// proxy is a UX layer that redirects users away from routes they can't use.

// Paths anyone can reach without logging in.
const PUBLIC_EXACT = new Set(['/'])
const PUBLIC_PREFIXES = ['/about', '/pricing', '/login', '/signup', '/apply']

// Role -> the route prefixes that role is allowed to use (beyond the shared
// /dashboard and /account, which any authenticated user may reach).
const CLIENT_PREFIXES = ['/tools', '/saved', '/browse', '/order', '/orders']
const PROVIDER_PREFIXES = ['/jobs', '/earnings', '/profile']
const GOLDEN_PAGES_PREFIXES = ['/golden-pages/setup', '/golden-pages/edit']

function startsWithAny(path: string, prefixes: string[]): boolean {
  return prefixes.some((p) => path === p || path.startsWith(p + '/'))
}

function isPublic(path: string): boolean {
  if (PUBLIC_EXACT.has(path)) return true
  if (startsWithAny(path, PUBLIC_PREFIXES)) return true
  // The public Golden Pages directory is open, but /golden-pages/setup|edit are not.
  if (path === '/golden-pages' || path.startsWith('/golden-pages/')) {
    return !startsWithAny(path, GOLDEN_PAGES_PREFIXES)
  }
  return false
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // Refresh + read the session. getClaims() is the recommended check in middleware.
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  const role = ((claims?.app_metadata ?? {}) as { role?: Role }).role ?? null

  const path = request.nextUrl.pathname

  if (isPublic(path)) return response

  // Everything past here requires a session.
  if (!claims) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  const redirectToDashboard = () => {
    const url = request.nextUrl.clone()
    url.pathname = role === 'admin' ? '/admin' : '/dashboard'
    return NextResponse.redirect(url)
  }

  // Admin area.
  if (path === '/admin' || path.startsWith('/admin/')) {
    return role === 'admin' ? response : redirectToDashboard()
  }
  // Role-specific areas.
  if (startsWithAny(path, CLIENT_PREFIXES)) {
    return role === 'client' ? response : redirectToDashboard()
  }
  if (startsWithAny(path, PROVIDER_PREFIXES)) {
    return role === 'provider' ? response : redirectToDashboard()
  }
  if (startsWithAny(path, GOLDEN_PAGES_PREFIXES)) {
    return role === 'golden_pages' ? response : redirectToDashboard()
  }

  // Shared authenticated routes (/dashboard, /account, anything else): allow.
  return response
}

export const config = {
  matcher: [
    // Run on all routes except Next internals and static assets.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
