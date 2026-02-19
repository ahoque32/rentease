import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  Home, 
  DollarSign, 
  Calendar, 
  Users, 
  FileText,
  Edit,
  Upload,
  CheckCircle
} from 'lucide-react'

interface PageProps {
  params: { id: string }
}

export default async function LeaseDetailPage({ params }: PageProps) {
  const supabase = createClient()
  const user = { id: '00000000-0000-0000-0000-000000000001', email: 'demo@rentease.app', user_metadata: { full_name: 'Demo Landlord' } }

  // Fetch lease with related data
  const { data: lease } = await supabase
    .from('leases')
    .select(`
      *,
      units(name, properties(id, name)),
      lease_tenants(tenants(id, first_name, last_name, email, phone))
    `)
    .eq('id', params.id)
    .eq('landlord_id', user!.id)
    .single()

  if (!lease) {
    redirect('/leases')
  }

  // Fetch rent schedule
  const { data: rentSchedule } = await supabase
    .from('rent_schedule')
    .select('*')
    .eq('lease_id', params.id)
    .order('due_date', { ascending: true })

  const primaryTenant = (lease as any).lease_tenants?.[0]?.tenants
  const unit = (lease as any).units
  const property = unit?.properties

  // Calculate lease stats
  const totalDue = rentSchedule?.reduce((sum, r) => sum + (r.amount_due || 0), 0) || 0
  const totalPaid = rentSchedule?.reduce((sum, r) => sum + (r.amount_paid || 0), 0) || 0
  const paidMonths = rentSchedule?.filter(r => r.status === 'paid').length || 0
  const totalMonths = rentSchedule?.length || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link href="/leases">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Leases
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Lease Agreement</h1>
          <div className="flex items-center gap-2">
            <Badge variant={
              lease.status === 'active' ? 'default' :
              lease.status === 'expiring' ? 'secondary' :
              'outline'
            }>
              {lease.status}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/leases/${params.id}/upload`}>
              <Upload className="w-4 h-4 mr-2" />
              Upload PDF
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/leases/${params.id}/edit`}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Link>
          </Button>
        </div>
      </div>

      {/* Lease Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">${lease.monthly_rent.toLocaleString()}</div>
            <p className="text-sm text-gray-600">Monthly Rent</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{paidMonths}/{totalMonths}</div>
            <p className="text-sm text-gray-600">Months Paid</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">${totalPaid.toLocaleString()}</div>
            <p className="text-sm text-gray-600">Total Collected</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">${(totalDue - totalPaid).toLocaleString()}</div>
            <p className="text-sm text-gray-600">Remaining</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Property & Unit */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Home className="w-5 h-5" />
              Property & Unit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Property</p>
              <Link 
                href={`/properties/${property?.id}`}
                className="text-blue-600 hover:underline font-medium"
              >
                {property?.name}
              </Link>
            </div>
            <div>
              <p className="text-sm text-gray-500">Unit</p>
              <p className="font-medium">{unit?.name}</p>
            </div>
          </CardContent>
        </Card>

        {/* Tenant */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5" />
              Tenant
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {primaryTenant ? (
              <>
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <Link 
                    href={`/tenants/${primaryTenant.id}`}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    {primaryTenant.first_name} {primaryTenant.last_name}
                  </Link>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p>{primaryTenant.email}</p>
                </div>
                {primaryTenant.phone && (
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p>{primaryTenant.phone}</p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-600">No tenant assigned</p>
            )}
          </CardContent>
        </Card>

        {/* Lease Terms */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Lease Terms
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Start Date</p>
                <p className="font-medium">{new Date(lease.start_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">End Date</p>
                <p className="font-medium">{new Date(lease.end_date).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Rent Due Day</p>
                <p className="font-medium">Day {lease.rent_due_day} of each month</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Grace Period</p>
                <p className="font-medium">{lease.grace_period_days} days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Terms */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Financial Terms
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Monthly Rent</p>
                <p className="font-medium">${lease.monthly_rent.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Security Deposit</p>
                <p className="font-medium">{lease.security_deposit ? `$${lease.security_deposit.toLocaleString()}` : 'Not specified'}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Late Fee</p>
              <p className="font-medium">{lease.late_fee_amount ? `$${lease.late_fee_amount.toLocaleString()}` : 'None'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rent Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rent Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Due Date</th>
                  <th className="text-right py-2 px-4">Amount Due</th>
                  <th className="text-right py-2 px-4">Amount Paid</th>
                  <th className="text-center py-2 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {rentSchedule?.map((payment) => (
                  <tr key={payment.id} className="border-b last:border-0">
                    <td className="py-3 px-4">{new Date(payment.due_date).toLocaleDateString()}</td>
                    <td className="text-right py-3 px-4">${payment.amount_due.toLocaleString()}</td>
                    <td className="text-right py-3 px-4">${(payment.amount_paid || 0).toLocaleString()}</td>
                    <td className="text-center py-3 px-4">
                      <Badge variant={
                        payment.status === 'paid' ? 'default' :
                        payment.status === 'partial' ? 'secondary' :
                        payment.status === 'overdue' ? 'destructive' :
                        'outline'
                      }>
                        {payment.status === 'paid' && <CheckCircle className="w-3 h-3 inline mr-1" />}
                        {payment.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Lease Document */}
      {lease.lease_document_url && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Lease Document
            </CardTitle>
          </CardHeader>
          <CardContent>
            <a 
              href={lease.lease_document_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              View Lease Document
            </a>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {lease.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{lease.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
