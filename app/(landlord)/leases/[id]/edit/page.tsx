import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EditLeaseForm from './edit-lease-form'

interface PageProps {
  params: { id: string }
}

export default async function EditLeasePage({ params }: PageProps) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch existing lease
  const { data: lease } = await supabase
    .from('leases')
    .select(`
      *,
      lease_tenants(tenant_id)
    `)
    .eq('id', params.id)
    .eq('landlord_id', user.id)
    .single()

  if (!lease) redirect('/leases')

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

  const currentTenantId = (lease as any).lease_tenants?.[0]?.tenant_id || ''

  return (
    <EditLeaseForm
      leaseId={params.id}
      lease={lease}
      currentTenantId={currentTenantId}
      units={(units as any) || []}
      tenants={tenants || []}
    />
  )
}
