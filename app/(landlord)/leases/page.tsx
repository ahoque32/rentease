import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, FileText } from 'lucide-react'

export default async function LeasesPage() {
  const supabase = createClient()
  const user = { id: '00000000-0000-0000-0000-000000000001', email: 'demo@rentease.app', user_metadata: { full_name: 'Demo Landlord' } }

  const { data: leases } = await supabase
    .from('leases')
    .select(`
      *,
      units(name, properties(name)),
      lease_tenants(tenants(first_name, last_name))
    `)
    .eq('landlord_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leases</h1>
          <p className="text-gray-600">Manage lease agreements and terms</p>
        </div>
        <Button asChild>
          <Link href="/leases/new">
            <Plus className="w-4 h-4 mr-2" />
            New Lease
          </Link>
        </Button>
      </div>

      {leases?.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No leases yet</h3>
            <p className="text-gray-600 mb-6">Create your first lease agreement</p>
            <Button asChild>
              <Link href="/leases/new">New Lease</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {leases?.map((lease) => (
            <Link key={lease.id} href={`/leases/${lease.id}`}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {(lease as any).units?.properties?.name} - {(lease as any).units?.name}
                      </h3>
                      <p className="text-gray-600">
                        {(lease as any).lease_tenants?.[0]?.tenants?.first_name} {(lease as any).lease_tenants?.[0]?.tenants?.last_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        ${lease.monthly_rent}/month • Due on day {lease.rent_due_day}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      lease.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : lease.status === 'expiring'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {lease.status}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
