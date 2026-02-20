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
    .from('maintenance_requests')
    .select('id')
    .eq('id', params.id)
    .eq('landlord_id', user.id)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  }

  const updateData: Record<string, unknown> = {}
  if (body.unit_id) updateData.unit_id = body.unit_id
  if (body.tenant_id !== undefined) updateData.tenant_id = body.tenant_id || null
  if (body.title) updateData.title = body.title
  if (body.description !== undefined) updateData.description = body.description || null
  if (body.category) updateData.category = body.category
  if (body.urgency) updateData.urgency = body.urgency
  if (body.status) updateData.status = body.status
  if (body.contractor_name !== undefined) updateData.contractor_name = body.contractor_name || null
  if (body.contractor_phone !== undefined) updateData.contractor_phone = body.contractor_phone || null
  if (body.contractor_email !== undefined) updateData.contractor_email = body.contractor_email || null
  if (body.scheduled_date !== undefined) updateData.scheduled_date = body.scheduled_date || null
  if (body.completed_at !== undefined) updateData.completed_at = body.completed_at || null
  if (body.estimated_cost !== undefined) updateData.estimated_cost = body.estimated_cost ? Number(body.estimated_cost) : null
  if (body.actual_cost !== undefined) updateData.actual_cost = body.actual_cost ? Number(body.actual_cost) : null
  if (body.notes !== undefined) updateData.notes = body.notes || null

  updateData.updated_at = new Date().toISOString()

  const { data: updated, error } = await admin
    .from('maintenance_requests')
    .update(updateData)
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ id: updated.id })
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
    .from('maintenance_requests')
    .select('id')
    .eq('id', params.id)
    .eq('landlord_id', user.id)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  }

  // Delete related photos first
  await admin.from('maintenance_photos').delete().eq('request_id', params.id)

  // Delete the request
  const { error } = await admin.from('maintenance_requests').delete().eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
