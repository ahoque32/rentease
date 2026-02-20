import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const admin = createAdminClient()

  // Verify ownership
  const { data: existing } = await admin
    .from('insurance_policies')
    .select('id')
    .eq('id', params.id)
    .eq('landlord_id', user.id)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'Policy not found' }, { status: 404 })
  }

  const updateData: Record<string, unknown> = {}
  if (body.property_id) updateData.property_id = body.property_id
  if (body.type) updateData.type = body.type
  if (body.provider_name !== undefined) updateData.provider_name = body.provider_name
  if (body.policy_number !== undefined) updateData.policy_number = body.policy_number || null
  if (body.coverage_amount !== undefined) updateData.coverage_amount = body.coverage_amount ? Number(body.coverage_amount) : null
  if (body.premium_amount !== undefined) updateData.premium_amount = body.premium_amount ? Number(body.premium_amount) : null
  if (body.premium_frequency) updateData.premium_frequency = body.premium_frequency
  if (body.start_date !== undefined) updateData.start_date = body.start_date || null
  if (body.renewal_date !== undefined) updateData.renewal_date = body.renewal_date || null
  if (body.notes !== undefined) updateData.notes = body.notes || null

  updateData.updated_at = new Date().toISOString()

  const { data: policy, error } = await admin
    .from('insurance_policies')
    .update(updateData)
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ id: policy.id })
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Verify ownership
  const { data: existing } = await admin
    .from('insurance_policies')
    .select('id')
    .eq('id', params.id)
    .eq('landlord_id', user.id)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'Policy not found' }, { status: 404 })
  }

  const { error } = await admin.from('insurance_policies').delete().eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
