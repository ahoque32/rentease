import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Home,
  Wrench,
  Users,
  Calendar,
  DollarSign,
  Edit,
} from 'lucide-react'
import DeleteMaintenanceButton from './delete-button'

interface PageProps {
  params: { id: string }
}

export default async function MaintenanceDetailPage({ params }: PageProps) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: request } = await supabase
    .from('maintenance_requests')
    .select(`
      *,
      units(name, properties(id, name)),
      tenants(id, first_name, last_name, phone)
    `)
    .eq('id', params.id)
    .eq('landlord_id', user!.id)
    .single()

  if (!request) {
    redirect('/maintenance')
  }

  const unit = (request as any).units
  const property = unit?.properties
  const tenant = (request as any).tenants

  const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    new: 'default',
    in_progress: 'secondary',
    scheduled: 'secondary',
    completed: 'default',
    cancelled: 'outline',
  }

  const urgencyColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    low: 'outline',
    medium: 'secondary',
    high: 'default',
    emergency: 'destructive',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link href="/maintenance">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Maintenance
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">{request.title}</h1>
          <div className="flex items-center gap-2">
            <Badge variant={statusColors[request.status] || 'outline'}>
              {request.status?.replace('_', ' ')}
            </Badge>
            <Badge variant={urgencyColors[request.urgency] || 'outline'}>
              {request.urgency} urgency
            </Badge>
            <Badge variant="outline">{request.category}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/maintenance/${params.id}/edit`}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Link>
          </Button>
          <DeleteMaintenanceButton requestId={params.id} />
        </div>
      </div>

      {/* Description */}
      {request.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{request.description}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Property & Unit */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Home className="w-5 h-5" />
              Location
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
              Reported By
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {tenant ? (
              <>
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <Link
                    href={`/tenants/${tenant.id}`}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    {tenant.first_name} {tenant.last_name}
                  </Link>
                </div>
                {tenant.phone && (
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p>{tenant.phone}</p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-600">No tenant assigned</p>
            )}
          </CardContent>
        </Card>

        {/* Contractor Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Contractor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {request.contractor_name ? (
              <>
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{request.contractor_name}</p>
                </div>
                {request.contractor_phone && (
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p>{request.contractor_phone}</p>
                  </div>
                )}
                {request.contractor_email && (
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p>{request.contractor_email}</p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-gray-600">No contractor assigned</p>
            )}
          </CardContent>
        </Card>

        {/* Dates & Costs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Dates & Costs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="font-medium">{new Date(request.created_at).toLocaleDateString()}</p>
              </div>
              {request.scheduled_date && (
                <div>
                  <p className="text-sm text-gray-500">Scheduled</p>
                  <p className="font-medium">{new Date(request.scheduled_date).toLocaleDateString()}</p>
                </div>
              )}
            </div>
            {request.completed_at && (
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="font-medium">{new Date(request.completed_at).toLocaleDateString()}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              {request.estimated_cost != null && (
                <div>
                  <p className="text-sm text-gray-500">Estimated Cost</p>
                  <p className="font-medium">${Number(request.estimated_cost).toLocaleString()}</p>
                </div>
              )}
              {request.actual_cost != null && (
                <div>
                  <p className="text-sm text-gray-500">Actual Cost</p>
                  <p className="font-medium">${Number(request.actual_cost).toLocaleString()}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {request.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{request.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
