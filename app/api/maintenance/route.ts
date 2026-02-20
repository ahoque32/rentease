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
  if (!body.unit_id || !body.title || !body.category || !body.urgency) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const maintenanceData = {
    landlord_id: user.id,
    unit_id: body.unit_id,
    tenant_id: body.tenant_id || null,
    title: body.title,
    description: body.description || null,
    category: body.category,
    urgency: body.urgency,
    status: 'new',
    notes: body.notes || null,
  }

  const { data: request_, error } = await admin
    .from('maintenance_requests')
    .insert(maintenanceData)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ id: request_.id })
}
