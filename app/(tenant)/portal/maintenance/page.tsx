import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Wrench } from 'lucide-react'
import { formatDate } from '@/lib/format'

interface PageProps {
  searchParams: { token?: string }
}

function statusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'completed') return 'default'
  if (status === 'in_progress' || status === 'scheduled') return 'secondary'
  if (status === 'cancelled') return 'outline'
  return 'destructive'
}

export default async function TenantMaintenancePage({ searchParams }: PageProps) {
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
      .select('id, first_name, last_name')
      .eq('auth_user_id', user.id)
      .single()
    tenant = data
  }

  if (!tenant && token) {
    const { data } = await admin
      .from('tenants')
      .select('id, first_name, last_name')
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

  const db = user ? supabase : admin
  const { data: requests } = await db
    .from('maintenance_requests')
    .select('id, title, status, category, severity, created_at')
    .or(`tenant_id.eq.${tenant.id},submitted_by_tenant.eq.${tenant.id}`)
    .order('created_at', { ascending: false })

  const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : ''

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maintenance Requests</h1>
          <p className="text-gray-600">Track open issues and submit new complaints.</p>
        </div>
        <Button asChild>
          <Link href={`/portal/maintenance/new${tokenQuery}`}>New Request</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {!requests || requests.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <Wrench className="mx-auto mb-3 h-10 w-10 text-gray-300" />
              <p className="text-sm text-gray-600">No maintenance requests yet.</p>
              <Button asChild className="mt-3" size="sm">
                <Link href={`/portal/maintenance/new${tokenQuery}`}>Submit a Request</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => {
                const href = token
                  ? `/portal/maintenance/${request.id}?token=${encodeURIComponent(token)}`
                  : `/portal/maintenance/${request.id}`

                return (
                  <Link key={request.id} href={href} className="block">
                    <div className="rounded-lg border p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium">{request.title}</p>
                          <p className="text-sm text-gray-600">
                            {request.category || 'other'} {request.severity ? `• ${request.severity}` : ''} • {formatDate(request.created_at)}
                          </p>
                        </div>
                        <Badge variant={statusBadgeVariant(request.status)}>{request.status.replace('_', ' ')}</Badge>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
