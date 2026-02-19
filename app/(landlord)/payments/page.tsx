import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, DollarSign } from 'lucide-react'

export default async function PaymentsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get current month's rent schedule
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const endOfMonth = new Date(startOfMonth)
  endOfMonth.setMonth(endOfMonth.getMonth() + 1)

  const { data: rentSchedule } = await supabase
    .from('rent_schedule')
    .select(`
      *,
      leases!inner(
        monthly_rent,
        landlord_id,
        units(name, properties(name)),
        lease_tenants(tenants(first_name, last_name))
      )
    `)
    .eq('leases.landlord_id', user!.id)
    .gte('due_date', startOfMonth.toISOString())
    .lt('due_date', endOfMonth.toISOString())
    .order('due_date')

  const totalDue = rentSchedule?.reduce((sum, r) => sum + (r.amount_due || 0), 0) || 0
  const totalPaid = rentSchedule?.reduce((sum, r) => sum + (r.amount_paid || 0), 0) || 0
  const totalOverdue = rentSchedule?.filter(r => r.status === 'overdue').length || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600">Track rent payments and view history</p>
        </div>
        <Button asChild>
          <Link href="/payments/record">
            <Plus className="w-4 h-4 mr-2" />
            Record Payment
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Total Due</p>
            <p className="text-2xl font-bold">${totalDue.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Total Collected</p>
            <p className="text-2xl font-bold text-green-600">${totalPaid.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Overdue</p>
            <p className="text-2xl font-bold text-red-600">{totalOverdue}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>This Month&apos;s Rent Roll</CardTitle>
        </CardHeader>
        <CardContent>
          {rentSchedule?.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No rent schedule for this month</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rentSchedule?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {(item as any).leases?.units?.properties?.name} - {(item as any).leases?.units?.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {(item as any).leases?.lease_tenants?.[0]?.tenants?.first_name} {(item as any).leases?.lease_tenants?.[0]?.tenants?.last_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${item.amount_due}</p>
                    <span className={`text-sm ${
                      item.status === 'paid' ? 'text-green-600' :
                      item.status === 'overdue' ? 'text-red-600' :
                      'text-yellow-600'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
