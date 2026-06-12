import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/EmptyState'
import { Plus, Users } from 'lucide-react'

export default async function TenantsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: tenants } = await supabase
    .from('tenants')
    .select('*')
    .eq('landlord_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
          <p className="text-gray-600">Manage your tenants and their information</p>
        </div>
        <Button asChild>
          <Link href="/tenants/new">
            <Plus className="w-4 h-4 mr-2" />
            Add Tenant
          </Link>
        </Button>
      </div>

      {tenants?.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No tenants yet"
          description="Add your first tenant to get started"
          actionLabel="Add Tenant"
          actionHref="/tenants/new"
        />
      ) : (
        <div className="grid gap-4">
          {tenants?.map((tenant) => (
            <Link key={tenant.id} href={`/tenants/${tenant.id}`}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {tenant.first_name} {tenant.last_name}
                      </h3>
                      <p className="text-gray-600">{tenant.email}</p>
                      {tenant.phone && (
                        <p className="text-sm text-gray-500">{tenant.phone}</p>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      tenant.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : tenant.status === 'applicant'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {tenant.status}
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
