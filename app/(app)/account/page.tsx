import { getSessionUser } from '@/lib/auth'
import { Shell } from '@/components/layout/Shell'
import { Card, CardTitle } from '@/components/ui/Card'
import { Placeholder } from '@/components/ui/Placeholder'

export default async function AccountPage() {
  const user = await getSessionUser()
  return (
    <Shell title="Account">
      <div className="max-w-2xl space-y-6">
        <Card>
          <CardTitle className="text-xl">Account details</CardTitle>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between border-b border-line pb-3">
              <dt className="text-muted">Email</dt>
              <dd className="text-cream">{user?.email ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Account type</dt>
              <dd className="text-cream capitalize">
                {user?.role?.replace('_', ' ') ?? '—'}
              </dd>
            </div>
          </dl>
        </Card>
        <Placeholder note="Billing & subscription management arrives with the payments sprint. Sign out is available in the sidebar." />
      </div>
    </Shell>
  )
}
