import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Building2,
  CalendarClock,
  FileText,
  Home,
  Plus,
  Receipt,
  Users,
  Wrench,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/format'

function requestStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'completed') return 'default'
  if (status === 'new') return 'destructive'
  if (status === 'cancelled') return 'outline'
  return 'secondary'
}

export default async function DashboardPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: properties } = await supabase
    .from('properties')
    .select('id')
    .eq('landlord_id', user!.id)
    .eq('archived', false)

  const propertyIds = properties?.map((property) => property.id) || []
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const sevenDaysFromNow = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000)

  const [unitsResult, leasesResult, maintenanceResult, upcomingDueResult, recentPaymentsResult] = await Promise.all([
    propertyIds.length
      ? supabase.from('units').select('id, status, property_id').in('property_id', propertyIds)
      : Promise.resolve({ data: [] as any[] }),
    supabase
      .from('leases')
      .select('id')
      .eq('landlord_id', user!.id)
      .eq('status', 'active'),
    supabase
      .from('maintenance_requests')
      .select('id, title, status, created_at, units(name, properties(name))')
      .eq('landlord_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('rent_schedule')
      .select(`
        id, due_date, amount_due, amount_paid, late_fee_applied, status,
        leases!inner(landlord_id, units(name, properties(name)), lease_tenants(tenants(first_name, last_name)))
      `)
      .eq('leases.landlord_id', user!.id)
      .gte('due_date', startOfToday.toISOString())
      .lte('due_date', sevenDaysFromNow.toISOString())
      .in('status', ['upcoming', 'due', 'partial', 'overdue'])
      .order('due_date', { ascending: true }),
    supabase
      .from('payments')
      .select(`
        id, amount, method, status, paid_at, created_at,
        leases!inner(landlord_id, units(name, properties(name)), lease_tenants(tenants(first_name, last_name)))
      `)
      .eq('leases.landlord_id', user!.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const units = unitsResult.data || []
  const activeLeases = leasesResult.data || []
  const maintenanceRequests = maintenanceResult.data || []
  const upcomingDue = upcomingDueResult.data || []
  const recentPayments = recentPaymentsResult.data || []

  const totalUnits = units.length
  const occupiedUnits = units.filter((unit) => unit.status === 'occupied').length
  const vacantUnits = totalUnits - occupiedUnits

  const summaryCards = [
    {
      title: 'Total Properties',
      value: properties?.length || 0,
      icon: Building2,
      href: '/properties',
    },
    {
      title: 'Total Units',
      value: totalUnits,
      icon: Home,
      href: '/properties',
    },
    {
      title: 'Occupied vs Vacant',
      value: `${occupiedUnits} / ${vacantUnits}`,
      icon: Users,
      href: '/properties',
    },
    {
      title: 'Active Leases',
      value: activeLeases.length,
      icon: FileText,
      href: '/leases',
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Portfolio snapshot and latest activity.</p>
        </div>
        <div className="hidden gap-2 md:flex">
          <Button asChild>
            <Link href="/properties/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Property
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/tenants/new">Add Tenant</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/leases/new">New Lease</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {summaryCards.map((card) => (
          <Link key={card.title} href={card.href}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <card.icon className="h-5 w-5 text-blue-600" />
                  <p className="text-xl font-bold text-gray-900">{card.value}</p>
                </div>
                <p className="text-sm text-gray-600">{card.title}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Recent Maintenance Requests
            </CardTitle>
            <Button variant="link" asChild className="px-0">
              <Link href="/maintenance">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {maintenanceRequests.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <p className="text-sm text-gray-600">No maintenance requests yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {maintenanceRequests.map((request) => (
                  <Link key={request.id} href={`/maintenance/${request.id}`} className="block rounded-lg border p-3 hover:bg-gray-50">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-900">{request.title}</p>
                        <p className="text-xs text-gray-500">
                          {(request as any).units?.properties?.name || 'Property'} - {(request as any).units?.name || 'Unit'}
                        </p>
                        <p className="text-xs text-gray-500">{formatDate(request.created_at)}</p>
                      </div>
                      <Badge variant={requestStatusVariant(request.status)}>{request.status.replace('_', ' ')}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5" />
              Upcoming Rent Due (7 days)
            </CardTitle>
            <Button variant="link" asChild className="px-0">
              <Link href="/payments">View payments</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingDue.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <p className="text-sm text-gray-600">No upcoming rent due in the next 7 days.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingDue.map((item) => {
                  const tenant = (item as any).leases?.lease_tenants?.[0]?.tenants
                  const balance = Number(item.amount_due || 0) + Number(item.late_fee_applied || 0) - Number(item.amount_paid || 0)

                  return (
                    <div key={item.id} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-gray-900">
                            {(item as any).leases?.units?.properties?.name || 'Property'} - {(item as any).leases?.units?.name || 'Unit'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {tenant ? `${tenant.first_name} ${tenant.last_name}` : 'Tenant'} - due {formatDate(item.due_date)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{formatCurrency(Math.max(balance, 0))}</p>
                          <p className="text-xs text-gray-500">{item.status}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Recent Payments Received
          </CardTitle>
          <Button variant="link" asChild className="px-0">
            <Link href="/payments">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentPayments.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <p className="text-sm text-gray-600">No payments received yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPayments.map((payment) => {
                const tenant = (payment as any).leases?.lease_tenants?.[0]?.tenants

                return (
                  <div key={payment.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium text-gray-900">
                        {tenant ? `${tenant.first_name} ${tenant.last_name}` : 'Tenant'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(payment as any).leases?.units?.properties?.name || 'Property'} - {(payment as any).leases?.units?.name || 'Unit'}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(payment.paid_at || payment.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(payment.amount)}</p>
                      <p className="text-xs text-gray-500">{payment.method || 'card'}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Button asChild>
          <Link href="/properties/new">Add Property</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/tenants/new">Add Tenant</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/leases/new">New Lease</Link>
        </Button>
      </div>
    </div>
  )
}
