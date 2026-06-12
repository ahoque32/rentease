import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { maintenanceRequestSchema } from '@/lib/validation/schemas'
import { forbidden, handleRouteError, internalError, unauthorized } from '@/lib/api/respond'
import { userOwnsUnit } from '@/lib/api/ownership'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return unauthorized()
    }

    const body = maintenanceRequestSchema.parse(await request.json())

    // The unit must belong to one of the landlord's properties
    if (!(await userOwnsUnit(supabase, body.unit_id, user.id))) {
      return forbidden()
    }

    const admin = createAdminClient()
    const { data: maintenanceRequest, error } = await admin
      .from('maintenance_requests')
      .insert({ landlord_id: user.id, status: 'new', ...body })
      .select()
      .single()

    if (error) {
      return internalError('Maintenance request insert failed', error)
    }

    return NextResponse.json({ id: maintenanceRequest.id })
  } catch (error) {
    return handleRouteError('Maintenance POST error', error)
  }
}
