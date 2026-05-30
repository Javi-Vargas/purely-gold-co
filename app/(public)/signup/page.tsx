'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card, CardTitle, CardDescription } from '@/components/ui/Card'
import { Input, Label } from '@/components/ui/Input'

type SignupRole = 'client' | 'golden_pages'

const ROLE_COPY: Record<SignupRole, { title: string; desc: string }> = {
  client: {
    title: 'Client',
    desc: 'Access all six AI campaign tools and the vetted vendor directory. $5/month.',
  },
  golden_pages: {
    title: 'Golden Pages',
    desc: 'A public-facing business listing so customers can find you.',
  },
}

function SignupInner() {
  const router = useRouter()
  const params = useSearchParams()
  const initialRole = params.get('role')
  const [role, setRole] = useState<SignupRole | null>(
    initialRole === 'client' || initialRole === 'golden_pages' ? initialRole : null,
  )
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [contactName, setContactName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!role) return
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role, business_name: businessName, contact_name: contactName },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // The DB trigger promotes `role` into app_metadata; refresh the token so the
    // new claim is present before we route into the authenticated app.
    await supabase.auth.refreshSession()
    router.push('/dashboard')
    router.refresh()
  }

  // Step 1 — role selector
  if (!role) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20">
        <h1 className="text-center font-display text-4xl font-medium text-cream">
          How will you use Purely GOLD?
        </h1>
        <p className="mt-3 text-center text-cream-dim">
          Choose your account type. (Providers apply{' '}
          <Link href="/apply" className="text-gold hover:underline">
            here
          </Link>
          .)
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {(Object.keys(ROLE_COPY) as SignupRole[]).map((r) => (
            <button key={r} onClick={() => setRole(r)} className="text-left">
              <Card className="h-full transition-colors hover:border-gold/50">
                <CardTitle>{ROLE_COPY[r].title}</CardTitle>
                <CardDescription>{ROLE_COPY[r].desc}</CardDescription>
              </Card>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Step 2 — details
  return (
    <div className="mx-auto max-w-md px-6 py-20">
      <button
        onClick={() => setRole(null)}
        className="mb-6 text-sm text-muted hover:text-cream"
      >
        ← Change account type
      </button>
      <Card>
        <CardTitle>Create your {ROLE_COPY[role].title} account</CardTitle>
        <CardDescription>
          Payments are not collected during this early access period.
        </CardDescription>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="business">Business name</Label>
            <Input
              id="business"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="contact">Contact name</Label>
            <Input
              id="contact"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
            />
          </div>
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
              minLength={6}
              required
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </Button>
        </form>
      </Card>
      <p className="mt-6 text-center text-sm text-cream-dim">
        Already have an account?{' '}
        <Link href="/login" className="text-gold hover:underline">
          Log in
        </Link>
      </p>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupInner />
    </Suspense>
  )
}
