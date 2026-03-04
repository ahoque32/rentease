import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PaymentForm } from '@/components/portal/PaymentForm'
import { Button } from '@/components/ui/button'

interface PageProps {
  searchParams: { token?: string; schedule?: string; status?: string }
}

export default async function TenantPayPage({ searchParams }: PageProps) {
  const supabase = createClient()
  const admin = createAdminClient()
  const token = searchParams.token
  const paymentStatus = searchParams.status
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let tenant: any = null

  if (user) {
    const { data: tenantByAuth } = await supabase
      .from('tenants')
      .select(`
        id, first_name, last_name,
        lease_tenants(
          leases(
            id, monthly_rent, landlord_id,
            units(name, properties(name))
          )
        )
      `)
      .eq('auth_user_id', user.id)
      .single()
    tenant = tenantByAuth
  }

  if (!tenant && token) {
    const { data: tenantByToken } = await admin
      .from('tenants')
      .select(`
        id, first_name, last_name,
        lease_tenants(
          leases(
            id, monthly_rent, landlord_id,
            units(name, properties(name))
          )
        )
      `)
      .eq('portal_token', token)
      .single()
    tenant = tenantByToken
  }

  if (!tenant) {
    return (
      <div className="text-center py-12">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Invalid Access</h1>
        <p className="text-gray-600">Please log in or use a valid invite link from your landlord.</p>
      </div>
    )
  }

  const tenantAny = tenant as any
  const leases = tenantAny.lease_tenants?.map((lt: any) => lt.leases).filter(Boolean) || []

  // Get unpaid rent schedule entries for all leases
  const leaseIds = leases.map((l: any) => l.id)
  const db = user ? supabase : admin
  const { data: unpaidSchedule } = await db
    .from('rent_schedule')
    .select('*')
    .in('lease_id', leaseIds)
    .in('status', ['due', 'overdue', 'partial', 'upcoming'])
    .order('due_date')

  const tokenQuery = token ? `?token=${token}` : ''

  function scheduleBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' {
    if (status === 'paid') return 'default'
    if (status === 'overdue') return 'destructive'
    return 'secondary'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pay Rent</h1>
        <p className="text-gray-600">Hi {tenant.first_name}, select a payment to make.</p>
      </div>

      {paymentStatus === 'success' && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <p className="text-green-800 text-sm">
              Payment submitted successfully. It may take a few moments to appear in your payment history.
            </p>
          </CardContent>
        </Card>
      )}

      {paymentStatus === 'cancelled' && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-700 text-sm">
              Payment was canceled. You can try again anytime.
            </p>
          </CardContent>
        </Card>
      )}

      {(!unpaidSchedule || unpaidSchedule.length === 0) ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-600">No payments due at this time. You&apos;re all caught up! 🎉</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {unpaidSchedule.map((schedule) => {
            const lease = leases.find((l: any) => l.id === schedule.lease_id) as any
            const amountOwed = schedule.amount_due + (schedule.late_fee_applied || 0) - (schedule.amount_paid || 0)

            return (
              <Card key={schedule.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {lease?.units?.properties?.name} — {lease?.units?.name}
                    </CardTitle>
                    <Badge variant={scheduleBadgeVariant(schedule.status)}>
                      {schedule.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-500">
                        Due: {new Date(schedule.due_date).toLocaleDateString()}
                      </p>
                      {schedule.late_fee_applied > 0 && (
                        <p className="text-sm text-red-600">
                          Late fee: ${schedule.late_fee_applied.toFixed(2)}
                        </p>
                      )}
                    </div>
                    <p className="text-2xl font-bold">${amountOwed.toFixed(2)}</p>
                  </div>

                  {amountOwed > 0 && (
                    <PaymentForm
                      rentScheduleId={schedule.id}
                      amount={amountOwed}
                      token={token}
                    />
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <div className="pt-2">
        <Button asChild variant="outline">
          <Link href={`/portal/payments${tokenQuery}`}>View Payment History</Link>
        </Button>
      </div>
    </div>
  )
}
