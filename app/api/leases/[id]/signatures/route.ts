import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { signatureSchema } from '@/lib/validation/schemas'
import { forbidden, handleRouteError, internalError, notFound, unauthorized } from '@/lib/api/respond'

/** Returns true when the user is the lease's landlord or one of its tenants. */
async function userCanAccessLease(
  supabase: ReturnType<typeof createClient>,
  leaseId: string,
  userId: string
) {
  const { data: lease } = await supabase
    .from('leases')
    .select('id, status, lease_tenants(tenant_id), units!inner(properties!inner(landlord_id))')
    .eq('id', leaseId)
    .single()

  if (!lease) return { lease: null, isLandlord: false, tenantId: null }

  const isLandlord = (lease as any).units?.properties?.landlord_id === userId
  const tenantIds = (lease as any).lease_tenants?.map((lt: any) => lt.tenant_id) || []

  let tenantId: string | null = null
  if (tenantIds.length > 0) {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('auth_user_id', userId)
      .in('id', tenantIds)
      .maybeSingle()
    tenantId = tenant?.id ?? null
  }

  return { lease, isLandlord, tenantId }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return unauthorized()
    }

    const { signer_name } = signatureSchema.parse(await request.json())

    const { lease, isLandlord, tenantId } = await userCanAccessLease(supabase, params.id, user.id)

    if (!lease) {
      return notFound('Lease')
    }

    if (!isLandlord && !tenantId) {
      return forbidden()
    }

    const signer_role = isLandlord ? 'landlord' : 'tenant'
    const signer_id = isLandlord ? user.id : tenantId!

    // Check if already signed
    const { data: existingSignature } = await supabase
      .from('signatures')
      .select('*')
      .eq('lease_id', params.id)
      .eq('signer_role', signer_role)
      .eq('signer_id', signer_id)
      .single()

    if (existingSignature) {
      return NextResponse.json({ error: 'Already signed' }, { status: 400 })
    }

    // Get IP address
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : request.ip || '127.0.0.1'
    const userAgent = request.headers.get('user-agent') || ''

    // Create signature
    const admin = createAdminClient()
    const { data: signature, error } = await admin
      .from('signatures')
      .insert({
        lease_id: params.id,
        signer_role,
        signer_id,
        signer_name,
        ip_address: ipAddress,
        user_agent: userAgent,
      })
      .select()
      .single()

    if (error) {
      console.error('Signature creation error:', error)
      return NextResponse.json({ error: 'Failed to create signature' }, { status: 500 })
    }

    // Check if both parties have signed
    const { data: signatures } = await admin
      .from('signatures')
      .select('*')
      .eq('lease_id', params.id)

    const hasLandlordSignature = signatures?.some(s => s.signer_role === 'landlord')
    const hasTenantSignature = signatures?.some(s => s.signer_role === 'tenant')

    // Update lease status if both have signed. The status guard makes the
    // transition idempotent if two signature requests land concurrently.
    if (hasLandlordSignature && hasTenantSignature) {
      await admin
        .from('leases')
        .update({ status: 'active' })
        .eq('id', params.id)
        .in('status', ['draft', 'pending_signatures'])
    } else if (lease.status === 'draft') {
      await admin
        .from('leases')
        .update({ status: 'pending_signatures' })
        .eq('id', params.id)
        .eq('status', 'draft')
    }

    return NextResponse.json({
      signature,
      lease_activated: hasLandlordSignature && hasTenantSignature
    })
  } catch (error) {
    return handleRouteError('Signature POST error', error)
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return unauthorized()
    }

    // Only the lease's landlord or tenants may view its signatures
    const { lease, isLandlord, tenantId } = await userCanAccessLease(supabase, params.id, user.id)

    if (!lease) {
      return notFound('Lease')
    }

    if (!isLandlord && !tenantId) {
      return forbidden()
    }

    const { data: signatures, error } = await supabase
      .from('signatures')
      .select('*')
      .eq('lease_id', params.id)

    if (error) {
      return internalError('Fetch signatures error', error)
    }

    return NextResponse.json({ signatures: signatures || [] })
  } catch (error) {
    return handleRouteError('Signature GET error', error)
  }
}