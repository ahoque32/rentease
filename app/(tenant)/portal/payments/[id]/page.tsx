import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatCurrency, formatDate } from '@/lib/format'

interface PageProps {
  params: { id: string }
  searchParams: { token?: string }
}

export default async function TenantReceiptPage({ params, searchParams }: PageProps) {
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
      <div className="py-12 text-center">
        <h1 className="mb-2 text-xl font-semibold text-gray-900">Invalid Access</h1>
        <p className="text-gray-600">Please log in or use a valid invite link from your landlord.</p>
      </div>
    )
  }

  const db = user ? supabase : admin
  const { data: payment } = await db
    .from('payments')
    .select(`
      *,
      leases(
        monthly_rent,
        start_date,
        end_date,
        units(name, properties(name, address_line1))
      )
    `)
    .eq('id', params.id)
    .eq('tenant_id', tenant.id)
    .single()

  if (!payment) {
    return (
      <div className="py-12 text-center">
        <h1 className="mb-2 text-xl font-semibold text-gray-900">Receipt Not Found</h1>
        <p className="text-gray-600">The requested payment receipt does not exist.</p>
      </div>
    )
  }

  const property = (payment as any).leases?.units?.properties
  const unit = (payment as any).leases?.units
  const tokenQuery = token ? `?token=${token}` : ''

  return (
    <div className="space-y-6 print:space-y-3">
      <div className="flex items-center justify-between print:hidden">
        <Link href={`/portal/payments${tokenQuery}`} className="text-sm text-blue-600 hover:underline">
          Back to Payments
        </Link>
        <p className="text-sm text-gray-500">Use your browser print dialog to print this receipt.</p>
      </div>

      <Card className="print:border-0 print:shadow-none">
        <CardHeader className="border-b print:border-b">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">Payment Receipt</CardTitle>
              <p className="mt-1 text-sm text-gray-600">Receipt ID: {payment.id}</p>
            </div>
            <StatusBadge kind="payment" value={payment.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">Tenant</p>
              <p className="font-medium">{tenant.first_name} {tenant.last_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-medium">{formatDate(payment.paid_at || payment.created_at, { includeTime: true })}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Amount</p>
              <p className="font-medium">{formatCurrency(payment.amount)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Payment Method</p>
              <p className="font-medium">{payment.method || 'card'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Payment Type</p>
              <p className="font-medium">{payment.type}</p>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <p className="text-sm text-gray-500">Property</p>
            <p className="font-medium">{property?.name || 'N/A'}</p>
            <p className="text-sm text-gray-600">{unit?.name || 'Unit N/A'}</p>
            {property?.address_line1 && <p className="text-sm text-gray-600">{property.address_line1}</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
