import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/notifications/email'
import { getUserRole } from '@/lib/auth/utils'

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const role = await getUserRole(supabase)

    if (!user || role !== 'owner') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()
    const { data: tenant, error: tenantError } = await admin
      .from('tenants')
      .select('id, landlord_id, first_name, last_name, email, portal_token')
      .eq('id', params.id)
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    if (tenant.landlord_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!tenant.email) {
      return NextResponse.json({ error: 'Tenant email is required before inviting' }, { status: 400 })
    }

    const portalToken = tenant.portal_token || crypto.randomUUID()
    if (!tenant.portal_token) {
      const { error: tokenError } = await admin
        .from('tenants')
        .update({ portal_token: portalToken })
        .eq('id', tenant.id)

      if (tokenError) {
        return NextResponse.json({ error: 'Could not generate invite token' }, { status: 500 })
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!appUrl) {
      return NextResponse.json({ error: 'APP_URL is not configured' }, { status: 500 })
    }

    const inviteLink = `${appUrl}/tenant-signup?token=${portalToken}`
    const tenantName = [tenant.first_name, tenant.last_name].filter(Boolean).join(' ') || 'there'

    await sendEmail({
      to: tenant.email,
      subject: 'You are invited to RentEase Tenant Portal',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">Tenant Portal Invitation</h2>
          <p>Hi ${tenantName},</p>
          <p>Your landlord invited you to set up your RentEase tenant account.</p>
          <a href="${inviteLink}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; margin: 16px 0;">Create Tenant Account</a>
          <p style="color: #6b7280; font-size: 14px;">If the button does not work, use this link: ${inviteLink}</p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Tenant invite error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
