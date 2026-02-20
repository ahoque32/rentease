import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EditInsuranceForm from './edit-insurance-form'

interface PageProps {
  params: { id: string }
}

export default async function EditInsurancePage({ params }: PageProps) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch existing policy
  const { data: policy } = await supabase
    .from('insurance_policies')
    .select('*')
    .eq('id', params.id)
    .eq('landlord_id', user.id)
    .single()

  if (!policy) redirect('/insurance')

  // Fetch properties
  const { data: properties } = await supabase
    .from('properties')
    .select('id, name')
    .eq('landlord_id', user.id)
    .order('name')

  return (
    <EditInsuranceForm
      policyId={params.id}
      policy={policy}
      properties={properties || []}
    />
  )
}
