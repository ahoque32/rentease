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
    .from('leases')
    .select('id')
    .eq('id', params.id)
    .eq('landlord_id', user.id)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'Lease not found' }, { status: 404 })
  }

  const updateData: Record<string, unknown> = {}
  if (body.unit_id) updateData.unit_id = body.unit_id
  if (body.start_date) updateData.start_date = body.start_date
  if (body.end_date) updateData.end_date = body.end_date
  if (body.monthly_rent !== undefined) updateData.monthly_rent = Number(body.monthly_rent)
  if (body.security_deposit !== undefined) updateData.security_deposit = body.security_deposit ? Number(body.security_deposit) : null
  if (body.late_fee_amount !== undefined) updateData.late_fee_amount = body.late_fee_amount ? Number(body.late_fee_amount) : 0
  if (body.grace_period_days !== undefined) updateData.grace_period_days = Number(body.grace_period_days)
  if (body.rent_due_day !== undefined) updateData.rent_due_day = Number(body.rent_due_day)
  if (body.notes !== undefined) updateData.notes = body.notes || null
  if (body.status) updateData.status = body.status

  updateData.updated_at = new Date().toISOString()

  const { data: lease, error } = await admin
    .from('leases')
    .update(updateData)
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Update tenant link if changed
  if (body.tenant_id) {
    await admin.from('lease_tenants').delete().eq('lease_id', params.id)
    await admin.from('lease_tenants').insert({
      lease_id: params.id,
      tenant_id: body.tenant_id,
      is_primary: true,
    })
  }

  return NextResponse.json({ id: lease.id })
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
    .from('leases')
    .select('id, unit_id')
    .eq('id', params.id)
    .eq('landlord_id', user.id)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'Lease not found' }, { status: 404 })
  }

  // Delete related records first
  await admin.from('rent_schedule').delete().eq('lease_id', params.id)
  await admin.from('payments').delete().eq('lease_id', params.id)
  await admin.from('lease_tenants').delete().eq('lease_id', params.id)

  // Set unit back to vacant
  await admin.from('units').update({ status: 'vacant' }).eq('id', existing.unit_id)

  // Delete the lease
  const { error } = await admin.from('leases').delete().eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
