import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import InsuranceForm from './insurance-form'

export default async function NewInsurancePage({
  searchParams,
}: {
  searchParams: { property?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: properties } = await supabase
    .from('properties')
    .select('id, name')
    .eq('landlord_id', user.id)
    .order('name')

  return (
    <InsuranceForm
      userId={user.id}
      properties={properties || []}
      defaultProperty={searchParams.property}
    />
  )
}
