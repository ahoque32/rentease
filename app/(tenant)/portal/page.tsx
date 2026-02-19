import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DollarSign, Wrench, FileText } from 'lucide-react'

interface PageProps {
  searchParams: { token?: string }
}

export default async function TenantPortalPage({ searchParams }: PageProps) {
  const supabase = createClient()
  
  // Get token from URL
  const token = searchParams.token
  
  if (!token) {
    return (
      <div className="text-center py-12">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Invalid Access</h1>
        <p className="text-gray-600">Please use the link provided by your landlord.</p>
      </div>
    )
  }

  // Verify token and get tenant data
  const { data: tenant } = await supabase
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

  if (!tenant) {
    return (
      <div className="text-center py-12">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Invalid Link</h1>
        <p className="text-gray-600">This link is no longer valid. Please contact your landlord.</p>
      </div>
    )
  }

  const currentLease = (tenant as any).lease_tenants?.[0]?.leases
  const unit = currentLease?.units
  const property = unit?.properties

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Hello, {tenant.first_name}!</h1>
        <p className="text-gray-600">{property?.name} - {unit?.name}</p>
      </div>

      <div className="grid gap-4">
        <Link href={`/portal/pay?token=${token}`}>
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

        <Link href={`/portal/maintenance?token=${token}`}>
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

        <Link href={`/portal/lease?token=${token}`}>
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
    </div>
  )
}
