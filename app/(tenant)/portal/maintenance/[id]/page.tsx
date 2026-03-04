import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import TenantCommentThread from './tenant-comment-thread'
import { formatDate } from '@/lib/format'

interface PageProps {
  params: { id: string }
  searchParams: { token?: string }
}

function statusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'completed') return 'default'
  if (status === 'in_progress' || status === 'scheduled') return 'secondary'
  if (status === 'cancelled') return 'outline'
  return 'destructive'
}

export default async function TenantMaintenanceDetailPage({ params, searchParams }: PageProps) {
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
      .select('id')
      .eq('auth_user_id', user.id)
      .single()
    tenant = data
  }

  if (!tenant && token) {
    const { data } = await admin
      .from('tenants')
      .select('id')
      .eq('portal_token', token)
      .single()
    tenant = data
  }

  if (!tenant) {
    return (
      <div className="text-center py-12">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Invalid Access</h1>
        <p className="text-gray-600">Please log in or use a valid invite link from your landlord.</p>
      </div>
    )
  }

  const db = user ? supabase : admin
  const { data: request } = await db
    .from('maintenance_requests')
    .select('id, title, description, category, severity, status, created_at, updated_at')
    .eq('id', params.id)
    .or(`tenant_id.eq.${tenant.id},submitted_by_tenant.eq.${tenant.id}`)
    .single()

  if (!request) {
    return (
      <div className="text-center py-12">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Request Not Found</h1>
        <p className="text-gray-600">This request does not belong to your account.</p>
      </div>
    )
  }

  const { data: comments } = await admin
    .from('complaint_comments')
    .select('id, author_type, body, created_at')
    .eq('request_id', params.id)
    .order('created_at', { ascending: true })

  const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : ''

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{request.title}</h1>
          <p className="text-sm text-gray-600">Submitted {formatDate(request.created_at)}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/portal/maintenance${tokenQuery}`}>Back to Requests</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant={statusBadgeVariant(request.status)}>{request.status.replace('_', ' ')}</Badge>
            <Badge variant="outline">{request.category || 'other'}</Badge>
            <Badge variant="outline">{request.severity || 'medium'} severity</Badge>
          </div>
          <p className="whitespace-pre-wrap text-sm text-gray-700">{request.description || 'No description provided.'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comments</CardTitle>
        </CardHeader>
        <CardContent>
          <TenantCommentThread
            requestId={params.id}
            token={token}
            initialComments={(comments || []) as any}
          />
        </CardContent>
      </Card>
    </div>
  )
}
