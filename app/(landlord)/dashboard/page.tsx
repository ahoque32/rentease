import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { 
  Building2, 
  Users, 
  DollarSign, 
  Wrench,
  TrendingUp,
  AlertCircle,
  ArrowRight
} from 'lucide-react'

export default async function DashboardPage() {
  const supabase = createClient()
  const user = { id: '00000000-0000-0000-0000-000000000001', email: 'demo@rentease.app', user_metadata: { full_name: 'Demo Landlord' } }

  // Fetch dashboard data
  const { data: properties } = await supabase
    .from('properties')
    .select('id')
    .eq('landlord_id', user!.id)
    .eq('archived', false)

  const { data: tenants } = await supabase
    .from('tenants')
    .select('id')
    .eq('landlord_id', user!.id)
    .eq('status', 'active')

  const { data: units } = await supabase
    .from('units')
    .select('id, status, property_id')
    .in('property_id', properties?.map(p => p.id) || [])

  const { data: maintenanceRequests } = await supabase
    .from('maintenance_requests')
    .select('id, status, urgency')
    .eq('landlord_id', user!.id)
    .in('status', ['new', 'in_progress', 'scheduled'])

  const { data: rentSchedule } = await supabase
    .from('rent_schedule')
    .select('amount_due, amount_paid, status, leases!inner(landlord_id)')
    .eq('leases.landlord_id', user!.id)
    .gte('due_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
    .lt('due_date', new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString())

  const totalUnits = units?.length || 0
  const occupiedUnits = units?.filter(u => u.status === 'occupied').length || 0
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0

  const totalRentDue = rentSchedule?.reduce((sum, r) => sum + (r.amount_due || 0), 0) || 0
  const totalRentPaid = rentSchedule?.reduce((sum, r) => sum + (r.amount_paid || 0), 0) || 0
  const collectionRate = totalRentDue > 0 ? Math.round((totalRentPaid / totalRentDue) * 100) : 0

  const overduePayments = rentSchedule?.filter(r => r.status === 'overdue').length || 0
  const urgentMaintenance = maintenanceRequests?.filter(r => r.urgency === 'high' || r.urgency === 'emergency').length || 0

  const stats = [
    { 
      name: 'Properties', 
      value: properties?.length || 0, 
      icon: Building2,
      href: '/properties'
    },
    { 
      name: 'Active Tenants', 
      value: tenants?.length || 0, 
      icon: Users,
      href: '/tenants'
    },
    { 
      name: 'Occupancy Rate', 
      value: `${occupancyRate}%`, 
      icon: TrendingUp,
      href: '/properties'
    },
    { 
      name: 'Collection Rate', 
      value: `${collectionRate}%`, 
      icon: DollarSign,
      href: '/payments'
    },
  ]

  const actionItems = [
    ...(overduePayments > 0 ? [{
      type: 'warning' as const,
      title: `${overduePayments} Overdue Payment${overduePayments > 1 ? 's' : ''}`,
      description: 'Rent payments are past due',
      href: '/payments',
    }] : []),
    ...(urgentMaintenance > 0 ? [{
      type: 'danger' as const,
      title: `${urgentMaintenance} Urgent Maintenance Request${urgentMaintenance > 1 ? 's' : ''}`,
      description: 'Requires immediate attention',
      href: '/maintenance',
    }] : []),
    ...(maintenanceRequests?.filter(r => r.status === 'new').length || 0 > 0 ? [{
      type: 'info' as const,
      title: `${maintenanceRequests?.filter(r => r.status === 'new').length} New Maintenance Request${(maintenanceRequests?.filter(r => r.status === 'new').length || 0) > 1 ? 's' : ''}`,
      description: 'Awaiting review',
      href: '/maintenance',
    }] : []),
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here&apos;s what&apos;s happening with your properties.</p>
        </div>
        <div className="hidden md:flex gap-2">
          <Button asChild variant="outline">
            <Link href="/payments/record">Record Payment</Link>
          </Button>
          <Button asChild>
            <Link href="/properties/new">Add Property</Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link key={stat.name} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <stat.icon className="w-8 h-8 text-blue-600" />
                  <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
                </div>
                <p className="mt-2 text-sm text-gray-600">{stat.name}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Rent Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            This Month&apos;s Rent
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Collection Progress</span>
              <span className="font-medium">${totalRentPaid.toLocaleString()} / ${totalRentDue.toLocaleString()}</span>
            </div>
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${collectionRate}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{occupiedUnits} of {totalUnits} units occupied</span>
              <span className="font-medium text-green-600">{collectionRate}% collected</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Items */}
      {actionItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Action Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {actionItems.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className="flex items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant={
                        item.type === 'danger' ? 'destructive' : 
                        item.type === 'warning' ? 'default' : 
                        'secondary'
                      }
                    >
                      {item.type === 'danger' ? 'Urgent' : item.type === 'warning' ? 'Action Needed' : 'Info'}
                    </Badge>
                    <div>
                      <p className="font-medium text-gray-900">{item.title}</p>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Add Property', href: '/properties/new', icon: Building2 },
          { label: 'Add Tenant', href: '/tenants/new', icon: Users },
          { label: 'Record Payment', href: '/payments/record', icon: DollarSign },
          { label: 'New Request', href: '/maintenance/new', icon: Wrench },
        ].map((action) => (
          <Link key={action.label} href={action.href}>
            <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
              <action.icon className="w-5 h-5" />
              <span>{action.label}</span>
            </Button>
          </Link>
        ))}
      </div>
    </div>
  )
}
