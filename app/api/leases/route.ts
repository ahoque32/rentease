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
  if (!body.unit_id || !body.start_date || !body.end_date || !body.monthly_rent) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const leaseData = {
    landlord_id: user.id,
    unit_id: body.unit_id,
    status: 'active',
    start_date: body.start_date,
    end_date: body.end_date,
    monthly_rent: Number(body.monthly_rent),
    security_deposit: body.security_deposit ? Number(body.security_deposit) : null,
    late_fee_amount: body.late_fee_amount ? Number(body.late_fee_amount) : 0,
    grace_period_days: body.grace_period_days ? Number(body.grace_period_days) : 5,
    rent_due_day: body.rent_due_day ? Number(body.rent_due_day) : 1,
    notes: body.notes || null,
  }

  // Validate numerics
  if (isNaN(leaseData.monthly_rent)) {
    return NextResponse.json({ error: 'Monthly rent must be a number' }, { status: 400 })
  }

  const { data: lease, error: leaseError } = await admin
    .from('leases')
    .insert(leaseData)
    .select()
    .single()

  if (leaseError) {
    return NextResponse.json({ error: leaseError.message }, { status: 500 })
  }

  // Link tenant
  if (body.tenant_id) {
    await admin.from('lease_tenants').insert({
      lease_id: lease.id,
      tenant_id: body.tenant_id,
      is_primary: true,
    })

    await admin.from('units').update({ status: 'occupied' }).eq('id', body.unit_id)
  }

  return NextResponse.json({ id: lease.id })
}
