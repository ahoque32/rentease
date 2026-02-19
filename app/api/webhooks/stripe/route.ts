import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { sendEmail, paymentReceiptEmail } from '@/lib/notifications/email'

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

export async function POST(request: Request) {
  const payload = await request.text()
  const signature = request.headers.get('stripe-signature')!
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  let event: Stripe.Event

  try {
    event = getStripeInstance().webhooks.constructEvent(payload, signature, webhookSecret)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 })
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
      const rentScheduleId = metadata.rent_schedule_id
      const leaseId = metadata.lease_id
      const tenantId = metadata.tenant_id
      const amount = pi.amount / 100

      if (rentScheduleId) {
        // Update rent schedule
        const { data: schedule } = await supabase
          .from('rent_schedule')
          .select('amount_due, amount_paid, late_fee_applied')
          .eq('id', rentScheduleId)
          .single()

        if (schedule) {
          const newPaid = (schedule.amount_paid || 0) + amount
          const totalDue = schedule.amount_due + (schedule.late_fee_applied || 0)
          const status = newPaid >= totalDue ? 'paid' : 'partial'

          await supabase
            .from('rent_schedule')
            .update({ amount_paid: newPaid, status })
            .eq('id', rentScheduleId)
        }

        // Record payment
        await supabase.from('payments').insert({
          lease_id: leaseId,
          tenant_id: tenantId,
          amount,
          type: 'rent',
          method: pi.payment_method_types?.includes('us_bank_account') ? 'ach' : 'card',
          status: 'completed',
          stripe_payment_intent_id: pi.id,
          for_month: schedule ? undefined : new Date().toISOString().slice(0, 10),
          paid_at: new Date().toISOString(),
        })

        // Send receipt email
        if (tenantId) {
          const { data: tenant } = await supabase
            .from('tenants')
            .select('first_name, last_name, email')
            .eq('id', tenantId)
            .single()

          if (tenant?.email) {
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
        }
      }
      break
    }

    case 'payment_intent.payment_failed': {
      const pi = event.data.object as Stripe.PaymentIntent
      const metadata = pi.metadata

      if (metadata.tenant_id && metadata.lease_id) {
        await supabase.from('payments').insert({
          lease_id: metadata.lease_id,
          tenant_id: metadata.tenant_id,
          amount: pi.amount / 100,
          type: 'rent',
          method: pi.payment_method_types?.includes('us_bank_account') ? 'ach' : 'card',
          status: 'failed',
          stripe_payment_intent_id: pi.id,
          for_month: new Date().toISOString().slice(0, 10),
        })
      }
      break
    }

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}
