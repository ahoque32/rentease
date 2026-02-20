import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const admin = createAdminClient()

  // Validate required fields
  if (!body.property_id || !body.type || !body.provider_name) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const policyData = {
    landlord_id: user.id,
    property_id: body.property_id,
    type: body.type,
    provider_name: body.provider_name,
    policy_number: body.policy_number || null,
    coverage_amount: body.coverage_amount ? Number(body.coverage_amount) : null,
    premium_amount: body.premium_amount ? Number(body.premium_amount) : null,
    premium_frequency: body.premium_frequency || 'annual',
    start_date: body.start_date || null,
    renewal_date: body.renewal_date || null,
    notes: body.notes || null,
  }

  // Validate numerics
  if (policyData.coverage_amount !== null && isNaN(policyData.coverage_amount)) {
    return NextResponse.json({ error: 'Coverage amount must be a number' }, { status: 400 })
  }
  if (policyData.premium_amount !== null && isNaN(policyData.premium_amount)) {
    return NextResponse.json({ error: 'Premium amount must be a number' }, { status: 400 })
  }

  const { data: policy, error } = await admin
    .from('insurance_policies')
    .insert(policyData)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ id: policy.id })
}
