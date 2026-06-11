import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { insurancePolicySchema } from '@/lib/validation/schemas'
import { forbidden, handleRouteError, internalError, unauthorized } from '@/lib/api/respond'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return unauthorized()
    }

    const body = insurancePolicySchema.parse(await request.json())

    // The property must belong to the requesting landlord
    const { data: property } = await supabase
      .from('properties')
      .select('id, landlord_id')
      .eq('id', body.property_id)
      .single()

    if (!property || property.landlord_id !== user.id) {
      return forbidden()
    }

    const admin = createAdminClient()
    const { data: policy, error } = await admin
      .from('insurance_policies')
      .insert({ landlord_id: user.id, ...body })
      .select()
      .single()

    if (error) {
      return internalError('Insurance policy insert failed', error)
    }

    return NextResponse.json({ id: policy.id })
  } catch (error) {
    return handleRouteError('Insurance POST error', error)
  }
}
