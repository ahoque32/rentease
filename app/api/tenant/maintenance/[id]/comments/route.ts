import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

async function resolveTenant(token: string | null) {
  const supabase = createClient()
  const admin = createAdminClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let tenant: any = null

  if (user) {
    const { data } = await supabase
      .from('tenants')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()
    tenant = data
  }

  if (!tenant && token) {
    const { data } = await admin
      .from('tenants')
      .select('id')
      .eq('portal_token', token)
      .single()
    tenant = data
  }

  return { tenant, admin }
}

async function canAccessRequest(admin: ReturnType<typeof createAdminClient>, requestId: string, tenantId: string) {
  const { data } = await admin
    .from('maintenance_requests')
    .select('id')
    .eq('id', requestId)
    .or(`tenant_id.eq.${tenantId},submitted_by_tenant.eq.${tenantId}`)
    .single()

  return Boolean(data)
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const { tenant, admin } = await resolveTenant(token)

  if (!tenant) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!(await canAccessRequest(admin, params.id, tenant.id))) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  }

  const { data, error } = await admin
    .from('complaint_comments')
    .select('id, request_id, author_type, author_id, body, created_at')
    .eq('request_id', params.id)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ comments: data || [] })
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const { tenant, admin } = await resolveTenant(token)

  if (!tenant) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!(await canAccessRequest(admin, params.id, tenant.id))) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  }

  const body = await request.json()
  const commentBody = String(body.body || '').trim()

  if (!commentBody) {
    return NextResponse.json({ error: 'Comment body is required' }, { status: 400 })
  }

  const { data, error } = await admin
    .from('complaint_comments')
    .insert({
      request_id: params.id,
      author_type: 'tenant',
      author_id: tenant.id,
      body: commentBody,
    })
    .select('id, request_id, author_type, author_id, body, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ comment: data })
}
