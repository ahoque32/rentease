import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

async function getOwnedRequestId(admin: ReturnType<typeof createAdminClient>, requestId: string, userId: string) {
  const { data } = await admin
    .from('maintenance_requests')
    .select('id')
    .eq('id', requestId)
    .eq('landlord_id', userId)
    .single()

  return data?.id || null
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const ownedRequestId = await getOwnedRequestId(admin, params.id, user.id)
  if (!ownedRequestId) {
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
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const ownedRequestId = await getOwnedRequestId(admin, params.id, user.id)
  if (!ownedRequestId) {
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
      author_type: 'owner',
      author_id: user.id,
      body: commentBody,
    })
    .select('id, request_id, author_type, author_id, body, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ comment: data })
}
