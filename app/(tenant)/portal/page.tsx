import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DollarSign, Wrench, FileText, CreditCard } from 'lucide-react'

interface PageProps {
  searchParams: { token?: string }
}

export default async function TenantPortalPage({ searchParams }: PageProps) {
  const supabase = createClient()
  const admin = createAdminClient()

  const token = searchParams.token
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let tenant: any = null
  let linkToken: string | null = null

  if (user) {
    const { data: tenantByAuth } = await supabase
      .from('tenants')
      .select(`
        *,
        lease_tenants(
          leases(
            *,
            units(name, properties(name, address_line1))
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
        *,
        lease_tenants(
          leases(
            *,
            units(name, properties(name, address_line1))
          )
        )
      `)
      .eq('portal_token', token)
      .single()
    tenant = tenantByToken
    linkToken = token
  }

  if (!tenant) {
    return (
      <div className="text-center py-12">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Invalid Access</h1>
        <p className="text-gray-600">Please log in or use a valid invite link from your landlord.</p>
      </div>
    )
  }

  const currentLease = (tenant as any).lease_tenants?.[0]?.leases
  const unit = currentLease?.units
  const property = unit?.properties
  const tenantId = (tenant as any).id
  const leaseId = currentLease?.id

  let unpaidSchedule: any[] = []
  let recentPayments: any[] = []

  if (leaseId) {
    const db = user ? supabase : admin
    const [{ data: schedule }, { data: payments }] = await Promise.all([
      db
        .from('rent_schedule')
        .select('id, due_date, amount_due, amount_paid, late_fee_applied, status')
        .eq('lease_id', leaseId)
        .in('status', ['upcoming', 'due', 'partial', 'overdue'])
        .order('due_date', { ascending: true }),
      db
        .from('payments')
        .select('id, amount, status, type, method, paid_at, created_at')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(6),
    ])

    unpaidSchedule = schedule || []
    recentPayments = payments || []
  }

  const totalBalanceDue = unpaidSchedule.reduce((sum, item) => {
    const owed = Number(item.amount_due || 0) + Number(item.late_fee_applied || 0) - Number(item.amount_paid || 0)
    return sum + Math.max(0, owed)
  }, 0)

  const nextPayment = unpaidSchedule.find((item) => {
    const owed = Number(item.amount_due || 0) + Number(item.late_fee_applied || 0) - Number(item.amount_paid || 0)
    return owed > 0
  })

  const tokenQuery = linkToken ? `?token=${linkToken}` : ''

  function formatDate(value?: string | null) {
    if (!value) return 'N/A'
    return new Date(value).toLocaleDateString()
  }

  function paymentBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' {
    if (status === 'completed') return 'default'
    if (status === 'pending') return 'secondary'
    return 'destructive'
  }

  function paymentBadgeLabel(status: string) {
    if (status === 'completed') return 'paid'
    return status
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hello, {tenant.first_name}!</h1>
        <p className="text-gray-600">{property?.name} - {unit?.name}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500">Current Balance Due</p>
            <p className="text-3xl font-bold text-gray-900">${totalBalanceDue.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500">Next Payment</p>
            {nextPayment ? (
              <div>
                <p className="text-xl font-bold text-gray-900">
                  ${(Number(nextPayment.amount_due || 0) + Number(nextPayment.late_fee_applied || 0) - Number(nextPayment.amount_paid || 0)).toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">Due {formatDate(nextPayment.due_date)}</p>
              </div>
            ) : (
              <p className="text-lg font-medium text-green-600">No payment due</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        <Link href={`/portal/pay${tokenQuery}`}>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Pay Rent</h3>
                  <p className="text-sm text-gray-600">Make a payment online</p>
                </div>
                <Badge>${currentLease?.monthly_rent}/mo</Badge>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/portal/payments${tokenQuery}`}>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Payment History</h3>
                  <p className="text-sm text-gray-600">View all rent payments and receipts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/portal/maintenance${tokenQuery}`}>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Maintenance Request</h3>
                  <p className="text-sm text-gray-600">Submit a repair request</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/portal/lease${tokenQuery}`}>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">My Lease</h3>
                  <p className="text-sm text-gray-600">View lease details</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lease Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-sm text-gray-500">Property</p>
            <p className="font-medium">{property?.name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Unit</p>
            <p className="font-medium">{unit?.name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Monthly Rent</p>
            <p className="font-medium">${Number(currentLease?.monthly_rent || 0).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Lease Dates</p>
            <p className="font-medium">{formatDate(currentLease?.start_date)} - {formatDate(currentLease?.end_date)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Payments</CardTitle>
          <Link href={`/portal/payments${tokenQuery}`} className="text-sm text-blue-600 hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardContent>
          {recentPayments.length === 0 ? (
            <p className="text-sm text-gray-600">No payments yet.</p>
          ) : (
            <div className="space-y-3">
              {recentPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                  <div>
                    <p className="font-medium">${Number(payment.amount || 0).toFixed(2)}</p>
                    <p className="text-sm text-gray-600">
                      {payment.type} • {payment.method || 'card'} • {formatDate(payment.paid_at || payment.created_at)}
                    </p>
                  </div>
                  <Badge variant={paymentBadgeVariant(payment.status)}>
                    {paymentBadgeLabel(payment.status)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
