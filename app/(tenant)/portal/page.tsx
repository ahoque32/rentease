import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DollarSign, Wrench, FileText, CreditCard } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/format'

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
      <div className="py-12 text-center">
        <h1 className="mb-2 text-xl font-semibold text-gray-900">Invalid Access</h1>
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

  const overdueItems = unpaidSchedule.filter((item) => item.status === 'overdue')

  const tokenQuery = linkToken ? `?token=${linkToken}` : ''

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
        <p className="text-gray-600">
          {property?.name || 'Property'}{unit?.name ? ` - ${unit.name}` : ''}
        </p>
      </div>

      {overdueItems.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-red-700">Rent is overdue</p>
            <p className="text-sm text-red-700">
              You have {overdueItems.length} overdue payment{overdueItems.length > 1 ? 's' : ''}. Please make a payment as soon as possible.
            </p>
            <Button asChild className="mt-3" size="sm" variant="destructive">
              <Link href={`/portal/pay${tokenQuery}`}>Pay Now</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-rose-500 to-orange-400 px-6 py-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-white/80" />
              <p className="text-sm font-medium text-white/90">Current Balance Due</p>
            </div>
            <p className="mt-1 text-3xl font-bold text-white">{formatCurrency(totalBalanceDue)}</p>
          </div>
        </Card>
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-500 px-6 py-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-white/80" />
              <p className="text-sm font-medium text-white/90">Next Payment</p>
            </div>
            {nextPayment ? (
              <div className="mt-1">
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(Number(nextPayment.amount_due || 0) + Number(nextPayment.late_fee_applied || 0) - Number(nextPayment.amount_paid || 0))}
                </p>
                <p className="text-sm text-white/80">Due {formatDate(nextPayment.due_date)}</p>
              </div>
            ) : (
              <p className="mt-1 text-lg font-medium text-white">No payment due ✓</p>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-4">
        <Link href={`/portal/pay${tokenQuery}`}>
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Pay Rent</h3>
                  <p className="text-sm text-gray-600">Make a payment online</p>
                </div>
                <Badge>{formatCurrency(currentLease?.monthly_rent || 0)}/mo</Badge>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/portal/payments${tokenQuery}`}>
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                  <CreditCard className="h-6 w-6 text-purple-600" />
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
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100">
                  <Wrench className="h-6 w-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Maintenance Request</h3>
                  <p className="text-sm text-gray-600">Submit or track repair requests</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/portal/lease${tokenQuery}`}>
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">My Lease</h3>
                  <p className="text-sm text-gray-600">View lease terms and signature status</p>
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
            <p className="font-medium">{formatCurrency(currentLease?.monthly_rent || 0)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Lease Dates</p>
            <p className="font-medium">
              {formatDate(currentLease?.start_date)} - {formatDate(currentLease?.end_date)}
            </p>
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
            <div className="rounded-lg border border-dashed p-6 text-center">
              <p className="text-sm text-gray-600">No payments yet.</p>
              <Button asChild className="mt-3" size="sm" variant="outline">
                <Link href={`/portal/pay${tokenQuery}`}>Make First Payment</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                  <div>
                    <p className="font-medium">{formatCurrency(payment.amount)}</p>
                    <p className="text-sm text-gray-600">
                      {payment.type} • {payment.method || 'card'} • {formatDate(payment.paid_at || payment.created_at)}
                    </p>
                  </div>
                  <Badge variant={paymentBadgeVariant(payment.status)}>{paymentBadgeLabel(payment.status)}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
