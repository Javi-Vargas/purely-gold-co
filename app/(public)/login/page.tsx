'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Input, Label } from '@/components/ui/Input'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    // Route admins to /admin, everyone else to the shared dashboard.
    const { data } = await supabase.auth.getClaims()
    const role = (data?.claims?.app_metadata as { role?: string } | undefined)?.role
    router.push(role === 'admin' ? '/admin' : '/dashboard')
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-md px-6 py-20">
      <Card>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Log in to your Golden Pages account.</CardDescription>
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
            {loading ? 'Logging in…' : 'Log in'}
          </Button>
        </form>
      </Card>
      <p className="mt-6 text-center text-sm text-cream-dim">
        Need an account?{' '}
        <Link href="/signup" className="text-gold hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  )
}
