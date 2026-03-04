import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/format'

interface PageProps {
  searchParams: { token?: string }
}

export default async function TenantLeasePage({ searchParams }: PageProps) {
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
      .select(`
        id, first_name, last_name,
        lease_tenants(
          leases(
            id, start_date, end_date, status, monthly_rent, security_deposit,
            late_fee_amount, grace_period_days, rent_due_day, lease_document_url,
            units(name, properties(name, address_line1, city, state, zip))
          )
        )
      `)
      .eq('auth_user_id', user.id)
      .single()

    tenant = data
  }

  if (!tenant && token) {
    const { data } = await admin
      .from('tenants')
      .select(`
        id, first_name, last_name,
        lease_tenants(
          leases(
            id, start_date, end_date, status, monthly_rent, security_deposit,
            late_fee_amount, grace_period_days, rent_due_day, lease_document_url,
            units(name, properties(name, address_line1, city, state, zip))
          )
        )
      `)
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

  const lease = (tenant as any).lease_tenants?.[0]?.leases
  const property = lease?.units?.properties
  const unit = lease?.units
  const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : ''

  if (!lease) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardContent className="py-10 text-center">
          <h2 className="mb-2 text-lg font-semibold text-gray-900">No active lease on file</h2>
          <p className="mb-6 text-sm text-gray-600">Your landlord hasn&apos;t attached a lease yet.</p>
          <Button asChild>
            <Link href={`/portal${tokenQuery}`}>Back to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const db = user ? supabase : admin
  const { data: signatures } = await db
    .from('signatures')
    .select('id, signer_role, signer_name, signed_at')
    .eq('lease_id', lease.id)

  const landlordSignature = signatures?.find((signature) => signature.signer_role === 'landlord')
  const tenantSignature = signatures?.find((signature) => signature.signer_role === 'tenant')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Lease</h1>
          <p className="text-gray-600">Review your lease terms and signature status.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/portal${tokenQuery}`}>Back to Dashboard</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lease Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-gray-500">Property</p>
            <p className="font-medium">{property?.name || 'N/A'}</p>
            {property?.address_line1 && (
              <p className="text-sm text-gray-600">
                {property.address_line1}
                {property.city ? `, ${property.city}` : ''}
                {property.state ? `, ${property.state}` : ''}
                {property.zip ? ` ${property.zip}` : ''}
              </p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-500">Unit</p>
            <p className="font-medium">{unit?.name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Lease Dates</p>
            <p className="font-medium">
              {formatDate(lease.start_date)} - {formatDate(lease.end_date)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <Badge variant={lease.status === 'active' ? 'default' : 'secondary'}>
              {lease.status === 'pending_signatures' ? 'Pending Signatures' : lease.status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Financial Terms</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-gray-500">Monthly Rent</p>
            <p className="font-medium">{formatCurrency(lease.monthly_rent)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Security Deposit</p>
            <p className="font-medium">
              {lease.security_deposit ? formatCurrency(lease.security_deposit) : 'Not specified'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Late Fee Policy</p>
            <p className="font-medium">
              {lease.late_fee_amount ? `${formatCurrency(lease.late_fee_amount)} after due date` : 'No late fee configured'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Grace Period</p>
            <p className="font-medium">{Number(lease.grace_period_days || 0)} day(s)</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Rent Due Day</p>
            <p className="font-medium">Day {Number(lease.rent_due_day || 1)} each month</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>E-signatures</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-sm font-medium text-gray-900">Landlord Signature</p>
            {landlordSignature ? (
              <p className="text-sm text-gray-600">
                Signed by {landlordSignature.signer_name} on {formatDate(landlordSignature.signed_at)}
              </p>
            ) : (
              <p className="text-sm text-amber-700">Pending signature</p>
            )}
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-sm font-medium text-gray-900">Tenant Signature</p>
            {tenantSignature ? (
              <p className="text-sm text-gray-600">
                Signed by {tenantSignature.signer_name} on {formatDate(tenantSignature.signed_at)}
              </p>
            ) : (
              <p className="text-sm text-amber-700">You have not signed this lease yet.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {lease.lease_document_url && (
        <Card>
          <CardHeader>
            <CardTitle>Lease Document</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={lease.lease_document_url} target="_blank" rel="noopener noreferrer">
                View Lease Document
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
