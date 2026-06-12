import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { apiError, internalError } from '@/lib/api/respond'
import { commentSchema } from '@/lib/validation/schemas'

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
    return internalError('Fetch maintenance comments error', error)
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

  const parsed = commentSchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) {
    return apiError('Comment body is required (max 5000 characters)', 400)
  }
  const commentBody = parsed.data.body

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
    return internalError('Create maintenance comment error', error)
  }

  return NextResponse.json({ comment: data })
}
