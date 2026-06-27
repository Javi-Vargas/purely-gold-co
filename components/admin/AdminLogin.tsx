'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Input, Label } from '@/components/ui/Input'

// The only sign-in surface in the app. Lives on /admin (no separate /login page).
// Accounts are provisioned manually in the database — there is no sign-up.
export function AdminLogin({ notAdminEmail }: { notAdminEmail?: string }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }
    // Re-render the server layout, which now sees the admin session.
    router.refresh()
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-6">
      <Card className="w-full">
        {notAdminEmail ? (
          <>
            <CardTitle>Not authorized</CardTitle>
            <CardDescription>
              {notAdminEmail} is signed in but isn&rsquo;t an admin account.
            </CardDescription>
            <Button className="mt-6 w-full" variant="secondary" onClick={signOut}>
              Sign out
            </Button>
          </>
        ) : (
          <>
            <CardTitle>Admin sign in</CardTitle>
            <CardDescription>Sign in to manage the Golden Pages directory.</CardDescription>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          </>
        )}
      </Card>
    </div>
  )
}
