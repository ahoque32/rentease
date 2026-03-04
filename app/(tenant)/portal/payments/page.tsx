import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface PageProps {
  searchParams: { token?: string }
}

function statusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' {
  if (status === 'completed') return 'default'
  if (status === 'pending') return 'secondary'
  return 'destructive'
}

function statusLabel(status: string) {
  if (status === 'completed') return 'paid'
  return status
}

function formatDate(value?: string | null) {
  if (!value) return 'N/A'
  return new Date(value).toLocaleDateString()
}

export default async function TenantPaymentsPage({ searchParams }: PageProps) {
  const supabase = createClient()
  const admin = createAdminClient()
  const token = searchParams.token
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let tenant: any = null

  if (user) {
    const { data } = await supabase
      .from('tenants')
      .select('id, first_name, last_name')
      .eq('auth_user_id', user.id)
      .single()
    tenant = data
  }

  if (!tenant && token) {
    const { data } = await admin
      .from('tenants')
      .select('id, first_name, last_name')
      .eq('portal_token', token)
      .single()
    tenant = data
  }

  if (!tenant) {
    return (
      <div className="text-center py-12">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Invalid Access</h1>
        <p className="text-gray-600">Please log in or use a valid invite link from your landlord.</p>
      </div>
    )
  }

  const db = user ? supabase : admin
  const { data: payments } = await db
    .from('payments')
    .select(`
      id, amount, type, method, status, paid_at, created_at, lease_id,
      leases(id, units(name, properties(name)))
    `)
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false })

  const tokenQuery = token ? `?token=${token}` : ''

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment History</h1>
          <p className="text-gray-600">All payments for {tenant.first_name} {tenant.last_name}</p>
        </div>
        <Link href={`/portal${tokenQuery}`} className="text-sm text-blue-600 hover:underline">
          Back to Dashboard
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {!payments || payments.length === 0 ? (
            <p className="text-sm text-gray-600">No payments recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => {
                const receiptHref = token
                  ? `/portal/payments/${payment.id}?token=${encodeURIComponent(token)}`
                  : `/portal/payments/${payment.id}`

                return (
                  <Link key={payment.id} href={receiptHref} className="block">
                    <div className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50">
                      <div>
                        <p className="font-medium">${Number(payment.amount || 0).toFixed(2)}</p>
                        <p className="text-sm text-gray-600">
                          {payment.type} • {payment.method || 'card'} • {formatDate(payment.paid_at || payment.created_at)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(payment as any).leases?.units?.properties?.name || 'Property'} - {(payment as any).leases?.units?.name || 'Unit'}
                        </p>
                      </div>
                      <Badge variant={statusBadgeVariant(payment.status)}>{statusLabel(payment.status)}</Badge>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
