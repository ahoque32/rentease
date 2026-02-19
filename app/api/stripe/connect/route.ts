import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe/client'

export async function POST() {
  try {
    const supabase = createClient()
    const user = { id: '00000000-0000-0000-0000-000000000001', email: 'demo@rentease.app' }

    if (false) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: landlord } = await supabase
      .from('landlords')
      .select('stripe_account_id, email, full_name')
      .eq('id', user.id)
      .single()

    if (!landlord) {
      return NextResponse.json({ error: 'Landlord not found' }, { status: 404 })
    }

    const stripe = getStripe()
    let accountId = landlord.stripe_account_id

    // Create Stripe Connect Express account if not exists
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: landlord.email,
        business_type: 'individual',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
          us_bank_account_ach_payments: { requested: true },
        },
        metadata: {
          landlord_id: user.id,
        },
      })
      accountId = account.id

      await supabase
        .from('landlords')
        .update({ stripe_account_id: accountId })
        .eq('id', user.id)
    }

    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?stripe=refresh`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?stripe=success`,
      type: 'account_onboarding',
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (error: any) {
    console.error('Stripe Connect error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
