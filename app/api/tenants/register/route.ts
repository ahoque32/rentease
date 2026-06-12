import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { handleRouteError } from '@/lib/api/respond'

function fullName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim()
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = body?.email as string | undefined
    const password = body?.password as string | undefined
    const firstName = body?.firstName as string | undefined
    const lastName = body?.lastName as string | undefined

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: createdUser, error: createUserError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: 'tenant',
        full_name: fullName(firstName, lastName),
      },
    })

    if (createUserError || !createdUser.user) {
      return NextResponse.json({ error: createUserError?.message || 'Could not create auth user' }, { status: 400 })
    }

    const fallbackLandlordId = process.env.SYSTEM_LANDLORD_ID
    let tenantRowCreated = false

    if (fallbackLandlordId) {
      const { error: tenantInsertError } = await admin.from('tenants').insert({
        first_name: firstName,
        last_name: lastName,
        email,
        auth_user_id: createdUser.user.id,
        status: 'active',
        landlord_id: fallbackLandlordId,
      })

      if (!tenantInsertError) {
        tenantRowCreated = true
      }
    } else {
      const { error: tenantInsertError } = await admin.from('tenants').insert({
        first_name: firstName,
        last_name: lastName,
        email,
        auth_user_id: createdUser.user.id,
        status: 'active',
      })

      if (!tenantInsertError) {
        tenantRowCreated = true
      }
    }

    return NextResponse.json({
      success: true,
      tenantRowCreated,
      message: tenantRowCreated
        ? 'Tenant account created'
        : 'Auth account created. No lease assigned yet.',
    })
  } catch (error) {
    return handleRouteError('Tenant register error', error)
  }
}
