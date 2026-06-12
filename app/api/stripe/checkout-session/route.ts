import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe/client'
import { handleRouteError } from '@/lib/api/respond'

export async function POST(request: Request) {
  try {
    const { rentScheduleId, token } = await request.json()

    if (!rentScheduleId) {
      return NextResponse.json({ error: 'Missing rentScheduleId' }, { status: 400 })
    }

    const supabase = createClient()
    const admin = createAdminClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    let tenant: any = null

    if (user) {
      const { data: tenantByAuth } = await admin
        .from('tenants')
        .select('id, email, first_name, last_name')
        .eq('auth_user_id', user.id)
        .single()
      tenant = tenantByAuth
    }

    if (!tenant && token) {
      const { data: tenantByToken } = await admin
        .from('tenants')
        .select('id, email, first_name, last_name')
        .eq('portal_token', token)
        .single()
      tenant = tenantByToken
    }

    if (!tenant) {
      return NextResponse.json({ error: 'Unauthorized tenant access' }, { status: 401 })
    }

    const { data: schedule } = await admin
      .from('rent_schedule')
      .select(`
        *,
        leases!inner(
          id,
          landlord_id,
          units(name, properties(name)),
          lease_tenants(tenant_id)
        )
      `)
      .eq('id', rentScheduleId)
      .single()

    if (!schedule) {
      return NextResponse.json({ error: 'Rent schedule not found' }, { status: 404 })
    }

    const lease = schedule.leases as any
    const leaseTenantIds = (lease?.lease_tenants || []).map((lt: any) => lt.tenant_id)

    if (!leaseTenantIds.includes(tenant.id)) {
      return NextResponse.json({ error: 'Schedule does not belong to tenant' }, { status: 403 })
    }

    if (schedule.status === 'paid') {
      return NextResponse.json({ error: 'Schedule entry already paid' }, { status: 400 })
    }

    const amountDue = Number(schedule.amount_due || 0) + Number(schedule.late_fee_applied || 0) - Number(schedule.amount_paid || 0)
    if (amountDue <= 0) {
      return NextResponse.json({ error: 'No balance due for this schedule' }, { status: 400 })
    }

    const { data: landlord } = await admin
      .from('landlords')
      .select('stripe_account_id, stripe_onboarding_complete')
      .eq('id', lease.landlord_id)
      .single()

    const origin = new URL(request.url).origin
    const tokenQuery = token ? `&token=${encodeURIComponent(token)}` : ''

    const metadata = {
      rent_schedule_id: rentScheduleId,
      lease_id: lease.id,
      tenant_id: tenant.id,
      landlord_id: lease.landlord_id,
    }

    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: tenant.email || undefined,
      success_url: `${origin}/portal/pay?status=success&schedule=${rentScheduleId}${tokenQuery}`,
      cancel_url: `${origin}/portal/pay?status=cancelled&schedule=${rentScheduleId}${tokenQuery}`,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(amountDue * 100),
            product_data: {
              name: `Rent Payment - ${lease?.units?.properties?.name || 'Property'} ${lease?.units?.name ? `(${lease.units.name})` : ''}`,
            },
          },
        },
      ],
      metadata,
      payment_intent_data: {
        metadata,
        ...(landlord?.stripe_account_id && landlord?.stripe_onboarding_complete
          ? {
              transfer_data: {
                destination: landlord.stripe_account_id,
              },
            }
          : {}),
      },
    })

    return NextResponse.json({
      sessionId: session.id,
      checkoutUrl: session.url,
      fallbackMode: landlord?.stripe_onboarding_complete ? 'connect' : 'platform',
    })
  } catch (error) {
    return handleRouteError('Checkout session creation error', error)
  }
}
