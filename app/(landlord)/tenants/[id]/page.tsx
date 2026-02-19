import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Home, 
  DollarSign, 
  FileText,
  Edit,
  UserPlus,
  AlertCircle
} from 'lucide-react'

interface PageProps {
  params: { id: string }
}

export default async function TenantDetailPage({ params }: PageProps) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch tenant
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', params.id)
    .eq('landlord_id', user!.id)
    .single()

  if (!tenant) {
    redirect('/tenants')
  }

  // Fetch active lease
  const { data: leaseData } = await supabase
    .from('lease_tenants')
    .select(`
      leases!inner(*, units(name, properties(name)))
    `)
    .eq('tenant_id', params.id)
    .eq('leases.status', 'active')
    .single()

  const lease = leaseData?.leases as any

  // Fetch payment history
  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('tenant_id', params.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Fetch maintenance requests
  const { data: maintenanceRequests } = await supabase
    .from('maintenance_requests')
    .select('*')
    .eq('tenant_id', params.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link href="/tenants">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tenants
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            {tenant.first_name} {tenant.last_name}
          </h1>
          <div className="flex items-center gap-2">
            <Badge variant={
              tenant.status === 'active' ? 'default' :
              tenant.status === 'applicant' ? 'secondary' :
              'outline'
            }>
              {tenant.status}
            </Badge>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/tenants/${params.id}/edit`}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Link>
        </Button>
      </div>

      {/* Contact Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p>{tenant.email}</p>
            </div>
          </div>
          
          {tenant.phone && (
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p>{tenant.phone}</p>
              </div>
            </div>
          )}

          {(tenant.emergency_contact_name || tenant.emergency_contact_phone) && (
            <div className="border-t pt-4 mt-4">
              <p className="text-sm text-gray-500 mb-2">Emergency Contact</p>
              {tenant.emergency_contact_name && <p>{tenant.emergency_contact_name}</p>}
              {tenant.emergency_contact_phone && <p className="text-gray-600">{tenant.emergency_contact_phone}</p>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="lease" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="lease">Current Lease</TabsTrigger>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        {/* Lease Tab */}
        <TabsContent value="lease">
          {lease ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Active Lease</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Home className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Unit</p>
                    <Link 
                      href={`/properties`} 
                      className="text-blue-600 hover:underline"
                    >
                      {lease.units?.properties?.name} - {lease.units?.name}
                    </Link>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Monthly Rent</p>
                    <p>${lease.monthly_rent.toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Start Date</p>
                    <p>{new Date(lease.start_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">End Date</p>
                    <p>{new Date(lease.end_date).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/leases/${lease.id}`}>
                      <FileText className="w-4 h-4 mr-2" />
                      View Lease
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="text-center py-8">
              <CardContent>
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No active lease</p>
                <Button asChild>
                  <Link href={`/leases/new?tenant=${params.id}`}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create Lease
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Payments</CardTitle>
            </CardHeader>
            <CardContent>
              {payments?.length === 0 ? (
                <p className="text-gray-600">No payments recorded</p>
              ) : (
                <div className="space-y-3">
                  {payments?.map((payment) => (
                    <div 
                      key={payment.id} 
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">${payment.amount.toLocaleString()}</p>
                        <p className="text-sm text-gray-500">
                          {payment.type} • {payment.method}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={
                          payment.status === 'completed' ? 'default' :
                          payment.status === 'pending' ? 'secondary' :
                          'destructive'
                        }>
                          {payment.status}
                        </Badge>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4">
                <Button variant="outline" asChild>
                  <Link href="/payments/record">Record Payment</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Maintenance Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {maintenanceRequests?.length === 0 ? (
                <p className="text-gray-600">No maintenance requests</p>
              ) : (
                <div className="space-y-3">
                  {maintenanceRequests?.map((request) => (
                    <Link key={request.id} href={`/maintenance/${request.id}`}>
                      <div className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{request.title}</p>
                          <Badge variant={
                            request.urgency === 'emergency' ? 'destructive' :
                            request.urgency === 'high' ? 'outline' :
                            'secondary'
                          }>
                            {request.urgency}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {request.status} • {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              <div className="mt-4">
                <Button variant="outline" asChild>
                  <Link href="/maintenance/new">New Request</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Notes */}
      {tenant.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{tenant.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
