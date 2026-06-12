import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { handleRouteError } from '@/lib/api/respond'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = body?.email as string | undefined
    const password = body?.password as string | undefined
    const firstName = body?.firstName as string | undefined
    const lastName = body?.lastName as string | undefined
    const inviteToken = body?.inviteToken as string | undefined

    if (!email || !password || !firstName || !lastName || !inviteToken) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: tenant, error: tenantError } = await admin
      .from('tenants')
      .select('id, email, auth_user_id')
      .eq('portal_token', inviteToken)
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Invalid invite token' }, { status: 404 })
    }

    if (tenant.auth_user_id) {
      return NextResponse.json({ error: 'This invite has already been used' }, { status: 409 })
    }

    if (tenant.email && tenant.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json({ error: 'Email does not match invite' }, { status: 400 })
    }

    const { data: createdUser, error: createUserError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: 'tenant',
        full_name: `${firstName} ${lastName}`.trim(),
      },
    })

    if (createUserError || !createdUser.user) {
      return NextResponse.json({ error: createUserError?.message || 'Could not create auth user' }, { status: 400 })
    }

    const { error: updateError } = await admin
      .from('tenants')
      .update({
        first_name: firstName,
        last_name: lastName,
        email,
        auth_user_id: createdUser.user.id,
        status: 'active',
      })
      .eq('id', tenant.id)

    if (updateError) {
      await admin.auth.admin.deleteUser(createdUser.user.id)
      return NextResponse.json({ error: 'Could not update tenant profile' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleRouteError('Tenant signup error', error)
  }
}
