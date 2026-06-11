import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { leaseSchema } from '@/lib/validation/schemas'
import { forbidden, handleRouteError, internalError, unauthorized } from '@/lib/api/respond'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return unauthorized()
    }

    const { tenant_id, ...leaseFields } = leaseSchema.parse(await request.json())

    // The unit must belong to one of the landlord's properties
    const { data: unit } = await supabase
      .from('units')
      .select('id, properties!inner(landlord_id)')
      .eq('id', leaseFields.unit_id)
      .single()

    const unitLandlordId = (unit as any)?.properties?.landlord_id
    if (!unit || unitLandlordId !== user.id) {
      return forbidden()
    }

    // The tenant (if linked) must belong to the landlord too
    if (tenant_id) {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('id, landlord_id')
        .eq('id', tenant_id)
        .single()

      if (!tenant || tenant.landlord_id !== user.id) {
        return forbidden()
      }
    }

    const admin = createAdminClient()
    const { data: lease, error: leaseError } = await admin
      .from('leases')
      .insert({ landlord_id: user.id, status: 'active', ...leaseFields })
      .select()
      .single()

    if (leaseError) {
      return internalError('Lease insert failed', leaseError)
    }

    if (tenant_id) {
      await admin.from('lease_tenants').insert({
        lease_id: lease.id,
        tenant_id,
        is_primary: true,
      })

      await admin.from('units').update({ status: 'occupied' }).eq('id', leaseFields.unit_id)
    }

    return NextResponse.json({ id: lease.id })
  } catch (error) {
    return handleRouteError('Lease POST error', error)
  }
}
