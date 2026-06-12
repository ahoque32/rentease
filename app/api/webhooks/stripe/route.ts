import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { sendEmail, paymentReceiptEmail } from '@/lib/notifications/email'
import { apiError } from '@/lib/api/respond'

function getStripeInstance() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-12-18.acacia' as any,
  })
}

// Use service role for webhook handling (no user session)
function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function resolveMethod(methodTypes?: string[] | null) {
  if (methodTypes?.includes('us_bank_account')) return 'ach'
  return 'card'
}

async function maybeSendReceiptEmail(supabase: ReturnType<typeof getServiceSupabase>, tenantId: string, leaseId: string, amount: number) {
  const { data: tenant } = await supabase
    .from('tenants')
    .select('first_name, last_name, email')
    .eq('id', tenantId)
    .single()

  if (!tenant?.email) return

  const { data: lease } = await supabase
    .from('leases')
    .select('units(name, properties(name))')
    .eq('id', leaseId)
    .single()

  const propertyName = (lease as any)?.units?.properties?.name || 'Your Property'
  const receipt = paymentReceiptEmail(
    `${tenant.first_name} ${tenant.last_name}`,
    amount,
    new Date().toLocaleDateString(),
    propertyName
  )

  try {
    await sendEmail({ to: tenant.email, ...receipt })
  } catch (e) {
    console.error('Failed to send receipt:', e)
  }
}

async function recordSuccessfulPayment(args: {
  supabase: ReturnType<typeof getServiceSupabase>
  rentScheduleId?: string
  leaseId?: string
  tenantId?: string
  paymentIntentId?: string
  amount: number
  method: string
}) {
  const { supabase, rentScheduleId, leaseId, tenantId, paymentIntentId, amount, method } = args

  if (!rentScheduleId || !leaseId || !tenantId || !paymentIntentId) {
    return
  }

  const { data: existing } = await supabase
    .from('payments')
    .select('id, status')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .maybeSingle()

  const { data: schedule } = await supabase
    .from('rent_schedule')
    .select('id, amount_due, amount_paid, late_fee_applied, due_date')
    .eq('id', rentScheduleId)
    .single()

  if (schedule) {
    const currentPaid = Number(schedule.amount_paid || 0)
    const totalDue = Number(schedule.amount_due || 0) + Number(schedule.late_fee_applied || 0)
    const newPaid = Math.min(totalDue, currentPaid + Number(amount || 0))
    const status = newPaid >= totalDue ? 'paid' : 'partial'

    await supabase
      .from('rent_schedule')
      .update({ amount_paid: newPaid, status })
      .eq('id', rentScheduleId)
  }

  const forMonth = schedule?.due_date
    ? new Date(new Date(schedule.due_date).setDate(1)).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10)

  if (existing) {
    if (existing.status !== 'completed') {
      await supabase
        .from('payments')
        .update({
          status: 'completed',
          amount,
          paid_at: new Date().toISOString(),
          method,
        })
        .eq('id', existing.id)
    }
    return
  }

  const { error: insertError } = await supabase.from('payments').insert({
    lease_id: leaseId,
    tenant_id: tenantId,
    amount,
    type: 'rent',
    method,
    status: 'completed',
    stripe_payment_intent_id: paymentIntentId,
    for_month: forMonth,
    paid_at: new Date().toISOString(),
  })

  if (!insertError) {
    await maybeSendReceiptEmail(supabase, tenantId, leaseId, amount)
  } else {
    console.error('Payment insert error:', insertError)
  }
}

export async function POST(request: Request) {
  const payload = await request.text()
  const signature = request.headers.get('stripe-signature')!
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  let event: Stripe.Event

  try {
    event = getStripeInstance().webhooks.constructEvent(payload, signature, webhookSecret)
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err)
    return apiError('Invalid webhook signature', 400)
  }

  const supabase = getServiceSupabase()

  switch (event.type) {
    case 'account.updated': {
      const account = event.data.object as Stripe.Account
      if (account.charges_enabled && account.payouts_enabled) {
        await supabase
          .from('landlords')
          .update({ stripe_onboarding_complete: true })
          .eq('stripe_account_id', account.id)
      }
      break
    }

    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent
      const metadata = pi.metadata
      await recordSuccessfulPayment({
        supabase,
        rentScheduleId: metadata.rent_schedule_id,
        leaseId: metadata.lease_id,
        tenantId: metadata.tenant_id,
        paymentIntentId: pi.id,
        amount: pi.amount / 100,
        method: resolveMethod(pi.payment_method_types),
      })
      break
    }

    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.payment_status !== 'paid') {
        break
      }

      const metadata = session.metadata || {}
      const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : undefined

      await recordSuccessfulPayment({
        supabase,
        rentScheduleId: metadata.rent_schedule_id,
        leaseId: metadata.lease_id,
        tenantId: metadata.tenant_id,
        paymentIntentId,
        amount: Number(session.amount_total || 0) / 100,
        method: resolveMethod(session.payment_method_types),
      })
      break
    }

    case 'payment_intent.payment_failed': {
      const pi = event.data.object as Stripe.PaymentIntent
      const metadata = pi.metadata

      if (metadata.tenant_id && metadata.lease_id) {
        const { data: existing } = await supabase
          .from('payments')
          .select('id')
          .eq('stripe_payment_intent_id', pi.id)
          .maybeSingle()

        if (existing) {
          await supabase
            .from('payments')
            .update({ status: 'failed' })
            .eq('id', existing.id)
          break
        }

        await supabase.from('payments').insert({
          lease_id: metadata.lease_id,
          tenant_id: metadata.tenant_id,
          amount: pi.amount / 100,
          type: 'rent',
          method: resolveMethod(pi.payment_method_types),
          status: 'failed',
          stripe_payment_intent_id: pi.id,
          for_month: new Date().toISOString().slice(0, 10),
        })
      }
      console.error('Stripe payment failed:', pi.id, pi.last_payment_error?.message)
      break
    }

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
