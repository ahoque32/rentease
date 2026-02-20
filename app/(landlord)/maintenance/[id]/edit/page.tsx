import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EditMaintenanceForm from './edit-maintenance-form'

interface PageProps {
  params: { id: string }
}

export default async function EditMaintenancePage({ params }: PageProps) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch existing request
  const { data: request } = await supabase
    .from('maintenance_requests')
    .select('*')
    .eq('id', params.id)
    .eq('landlord_id', user.id)
    .single()

  if (!request) redirect('/maintenance')

  // Fetch units
  const { data: properties } = await supabase
    .from('properties')
    .select('id')
    .eq('landlord_id', user.id)

  const propertyIds = properties?.map(p => p.id) || []

  const { data: units } = await supabase
    .from('units')
    .select('id, name, properties(name)')
    .in('property_id', propertyIds.length ? propertyIds : ['__none__'])
    .order('name')

  // Fetch tenants
  const { data: tenants } = await supabase
    .from('tenants')
    .select('id, first_name, last_name')
    .eq('landlord_id', user.id)
    .order('last_name')

  return (
    <EditMaintenanceForm
      requestId={params.id}
      request={request}
      units={(units as any) || []}
      tenants={tenants || []}
    />
  )
}
