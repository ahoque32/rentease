import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe/client'

export async function POST(request: Request) {
  try {
    const { rentScheduleId, paymentMethod } = await request.json()
    const supabase = createClient()

    // Get rent schedule with lease and landlord info
    const { data: schedule } = await supabase
      .from('rent_schedule')
      .select(`
        *,
        leases!inner(
          id,
          landlord_id,
          monthly_rent,
          units(name, properties(name)),
          lease_tenants(tenant_id, tenants(id, first_name, last_name, email))
        )
      `)
      .eq('id', rentScheduleId)
      .single()

    if (!schedule) {
      return NextResponse.json({ error: 'Rent schedule not found' }, { status: 404 })
    }

    if (schedule.status === 'paid') {
      return NextResponse.json({ error: 'Already paid' }, { status: 400 })
    }

    const lease = schedule.leases as any
    const landlordId = lease.landlord_id
    const amountDue = (schedule.amount_due + schedule.late_fee_applied - schedule.amount_paid) * 100 // cents

    // Get landlord's Stripe account
    const { data: landlord } = await supabase
      .from('landlords')
      .select('stripe_account_id, stripe_onboarding_complete')
      .eq('id', landlordId)
      .single()

    if (!landlord?.stripe_account_id || !landlord.stripe_onboarding_complete) {
      return NextResponse.json({ error: 'Landlord has not connected Stripe' }, { status: 400 })
    }

    const stripe = getStripe()
    const tenant = lease.lease_tenants?.[0]?.tenants

    const paymentIntentData: any = {
      amount: Math.round(amountDue),
      currency: 'usd',
      metadata: {
        rent_schedule_id: rentScheduleId,
        lease_id: lease.id,
        tenant_id: tenant?.id,
        landlord_id: landlordId,
      },
      transfer_data: {
        destination: landlord.stripe_account_id,
      },
    }

    // Set payment method types based on selection
    if (paymentMethod === 'ach') {
      paymentIntentData.payment_method_types = ['us_bank_account']
    } else {
      paymentIntentData.payment_method_types = ['card']
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData)

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amountDue / 100,
    })
  } catch (error: any) {
    console.error('Create payment intent error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
