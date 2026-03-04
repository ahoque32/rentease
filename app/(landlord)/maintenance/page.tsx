import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Wrench } from 'lucide-react'
import { formatDate } from '@/lib/format'

export default async function MaintenancePage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: requests } = await supabase
    .from('maintenance_requests')
    .select(`
      *,
      units(name, properties(name)),
      tenants(first_name, last_name)
    `)
    .eq('landlord_id', user!.id)
    .order('created_at', { ascending: false })

  const newRequestsCount = requests?.filter((request) => request.status === 'new').length || 0

  const statusColors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    scheduled: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800',
  }

  const urgencyColors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    emergency: 'bg-red-100 text-red-800',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Maintenance</h1>
            {newRequestsCount > 0 && <Badge variant="destructive">{newRequestsCount} new</Badge>}
          </div>
          <p className="text-gray-600">Track and manage maintenance requests</p>
        </div>
        <Button asChild>
          <Link href="/maintenance/new">
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Link>
        </Button>
      </div>

      {requests?.length === 0 ? (
        <Card className="py-12 text-center">
          <CardContent>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Wrench className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-gray-900">No maintenance requests yet</h3>
            <p className="mb-6 text-gray-600">Tenant requests will appear here. You can also create one manually.</p>
            <Button asChild>
              <Link href="/maintenance/new">Create Request</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests?.map((request) => (
            <Link key={request.id} href={`/maintenance/${request.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{request.title}</h3>
                      <p className="text-gray-600">
                        {(request as any).units?.properties?.name} - {(request as any).units?.name}
                      </p>
                      {(request as any).tenants && (
                        <p className="text-sm text-gray-500">
                          Reported by {(request as any).tenants?.first_name} {(request as any).tenants?.last_name}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">Created {formatDate(request.created_at)}</p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`rounded-full px-3 py-1 text-sm font-medium ${urgencyColors[request.urgency || 'medium']}`}>
                        {request.urgency}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusColors[request.status || 'new']}`}>
                        {request.status}
                      </span>
                    </div>
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
