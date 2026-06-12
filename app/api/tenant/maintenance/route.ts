import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { internalError } from '@/lib/api/respond'

const CATEGORY_VALUES = ['maintenance', 'noise', 'billing', 'other'] as const
const SEVERITY_VALUES = ['low', 'medium', 'high'] as const
const LEASE_PRIORITY = ['active', 'expiring', 'draft', 'expired', 'terminated'] as const

type Category = typeof CATEGORY_VALUES[number]
type Severity = typeof SEVERITY_VALUES[number]

async function resolveTenant(token: string | null) {
  const supabase = createClient()
  const admin = createAdminClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let tenant: any = null
  let usingToken = false

  if (user) {
    const { data } = await supabase
      .from('tenants')
      .select('id, landlord_id')
      .eq('auth_user_id', user.id)
      .single()
    tenant = data
  }

  if (!tenant && token) {
    const { data } = await admin
      .from('tenants')
      .select('id, landlord_id')
      .eq('portal_token', token)
      .single()
    tenant = data
    usingToken = Boolean(data)
  }

  return { tenant, db: usingToken ? admin : supabase, admin }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const { tenant, db } = await resolveTenant(token)

  if (!tenant) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await db
    .from('maintenance_requests')
    .select('id, title, description, status, urgency, category, severity, created_at, updated_at')
    .or(`tenant_id.eq.${tenant.id},submitted_by_tenant.eq.${tenant.id}`)
    .order('created_at', { ascending: false })

  if (error) {
    return internalError('Fetch tenant maintenance requests error', error)
  }

  return NextResponse.json({ requests: data || [] })
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const { tenant, admin } = await resolveTenant(token)

  if (!tenant) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const title = String(body.title || '').trim()
  const description = String(body.description || '').trim()
  const category = String(body.category || '') as Category
  const severity = String(body.severity || '') as Severity

  if (!title || !CATEGORY_VALUES.includes(category) || !SEVERITY_VALUES.includes(severity)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const { data: leaseLinks, error: leaseError } = await admin
    .from('lease_tenants')
    .select('lease_id, leases(unit_id, landlord_id, status)')
    .eq('tenant_id', tenant.id)

  if (leaseError) {
    return internalError('Fetch tenant leases error', leaseError)
  }

  const leaseRows = (leaseLinks || [])
    .map((row: any) => row.leases)
    .filter(Boolean) as Array<{ unit_id: string; landlord_id: string; status: string }>

  leaseRows.sort((a, b) => {
    const aIdx = LEASE_PRIORITY.indexOf((a.status || 'terminated') as any)
    const bIdx = LEASE_PRIORITY.indexOf((b.status || 'terminated') as any)
    return aIdx - bIdx
  })

  const lease = leaseRows[0]
  if (!lease?.unit_id || !lease?.landlord_id) {
    return NextResponse.json({ error: 'No linked unit found for tenant' }, { status: 400 })
  }

  const { data, error } = await admin
    .from('maintenance_requests')
    .insert({
      landlord_id: lease.landlord_id,
      unit_id: lease.unit_id,
      tenant_id: tenant.id,
      submitted_by_tenant: tenant.id,
      title,
      description: description || null,
      category,
      severity,
      urgency: severity,
      status: 'new',
    })
    .select('id')
    .single()

  if (error) {
    return internalError('Create tenant maintenance request error', error)
  }

  return NextResponse.json({ id: data.id })
}
