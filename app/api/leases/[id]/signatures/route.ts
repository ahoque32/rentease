import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { signer_name } = body

    if (!signer_name) {
      return NextResponse.json({ error: 'Signer name is required' }, { status: 400 })
    }

    // Get lease details to verify access
    const { data: lease } = await supabase
      .from('leases')
      .select('*, lease_tenants(tenant_id), units!inner(property_id, properties!inner(landlord_id))')
      .eq('id', params.id)
      .single()

    if (!lease) {
      return NextResponse.json({ error: 'Lease not found' }, { status: 404 })
    }

    // Determine signer role
    const isLandlord = lease.units?.properties?.landlord_id === user.id
    const tenantIds = lease.lease_tenants?.map((lt: any) => lt.tenant_id) || []
    
    // Check if user is a tenant on this lease
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('auth_user_id', user.id)
      .in('id', tenantIds)
      .single()
    
    const isTenant = !!tenant

    if (!isLandlord && !isTenant) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const signer_role = isLandlord ? 'landlord' : 'tenant'
    const signer_id = isLandlord ? user.id : tenant!.id

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

    // Update lease status if both have signed
    if (hasLandlordSignature && hasTenantSignature) {
      await admin
        .from('leases')
        .update({ status: 'active' })
        .eq('id', params.id)
    } else if (lease.status === 'draft') {
      await admin
        .from('leases')
        .update({ status: 'pending_signatures' })
        .eq('id', params.id)
    }

    return NextResponse.json({ 
      signature,
      lease_activated: hasLandlordSignature && hasTenantSignature
    })
  } catch (error: any) {
    console.error('Signature API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get signatures for this lease
    const { data: signatures, error } = await supabase
      .from('signatures')
      .select('*')
      .eq('lease_id', params.id)

    if (error) {
      console.error('Fetch signatures error:', error)
      return NextResponse.json({ error: 'Failed to fetch signatures' }, { status: 500 })
    }

    return NextResponse.json({ signatures: signatures || [] })
  } catch (error: any) {
    console.error('Get signatures API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}