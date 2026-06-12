import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { leaseSchema } from '@/lib/validation/schemas'
import { forbidden, handleRouteError, internalError, unauthorized } from '@/lib/api/respond'
import { userOwnsTenant, userOwnsUnit } from '@/lib/api/ownership'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return unauthorized()
    }

    const { tenant_id, ...leaseFields } = leaseSchema.parse(await request.json())

    // The unit and the linked tenant (if any) must belong to the landlord
    const [ownsUnit, ownsTenant] = await Promise.all([
      userOwnsUnit(supabase, leaseFields.unit_id, user.id),
      tenant_id ? userOwnsTenant(supabase, tenant_id, user.id) : Promise.resolve(true),
    ])

    if (!ownsUnit || !ownsTenant) {
      return forbidden()
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
