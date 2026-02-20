import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LeaseForm from './lease-form'

export default async function NewLeasePage({
  searchParams,
}: {
  searchParams: { tenant?: string; unit?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

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

  const { data: tenants } = await supabase
    .from('tenants')
    .select('id, first_name, last_name')
    .eq('landlord_id', user.id)
    .in('status', ['applicant', 'active'])
    .order('last_name')

  return (
    <LeaseForm
      userId={user.id}
      units={(units as any) || []}
      tenants={tenants || []}
      defaultUnit={searchParams.unit}
      defaultTenant={searchParams.tenant}
    />
  )
}
