import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  sendEmail,
  rentReminderEmail,
  overdueRentEmail,
  leaseExpiryEmail,
} from '@/lib/notifications/email'
import { sendSMS, rentDueReminderSMS, overdueAlertSMS } from '@/lib/notifications/sms'

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function recordNotification(
  supabase: any,
  data: {
    landlord_id: string
    recipient_type: string
    recipient_id: string
    recipient_contact: string
    channel: string
    type: string
    subject: string
    body: string
    dedup_key: string
  }
) {
  // Check dedup
  const { data: existing } = await supabase
    .from('notifications')
    .select('id')
    .eq('dedup_key', data.dedup_key)
    .single()

  if (existing) return false

  await supabase.from('notifications').insert({
    ...data,
    status: 'sent',
    sent_at: new Date().toISOString(),
  })
  return true
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServiceSupabase()
  const today = new Date()
  const stats = { rentReminders: 0, overdueAlerts: 0, leaseExpiry: 0, sms: 0 }

  // 1. Rent reminders (3 days before due)
  const reminderDate = new Date(today)
  reminderDate.setDate(reminderDate.getDate() + 3)
  const reminderDateStr = reminderDate.toISOString().slice(0, 10)

  const { data: upcomingRent } = await supabase
    .from('rent_schedule')
    .select(`
      id, due_date, amount_due,
      leases!inner(
        id, landlord_id,
        units(name, properties(name)),
        lease_tenants(tenants(id, first_name, last_name, email, phone, ghl_contact_id))
      )
    `)
    .eq('due_date', reminderDateStr)
    .in('status', ['upcoming', 'due'])

  if (upcomingRent) {
    for (const entry of upcomingRent) {
      const lease = entry.leases as any
      const tenants = lease.lease_tenants?.map((lt: any) => lt.tenants).filter(Boolean) || []

      for (const tenant of tenants) {
        if (!tenant) continue
        const tenantName = `${tenant.first_name} ${tenant.last_name}`
        const paymentLink = `${process.env.NEXT_PUBLIC_APP_URL}/portal/pay?schedule=${entry.id}`
        const dedupKey = `rent_reminder:${entry.id}:${tenant.id}`

        if (tenant.email) {
          const email = rentReminderEmail(tenantName, entry.amount_due, entry.due_date, paymentLink)
          const isNew = await recordNotification(supabase, {
            landlord_id: lease.landlord_id,
            recipient_type: 'tenant',
            recipient_id: tenant.id,
            recipient_contact: tenant.email,
            channel: 'email',
            type: 'rent_reminder',
            subject: email.subject,
            body: email.html,
            dedup_key: dedupKey,
          })

          if (isNew) {
            try {
              await sendEmail({ to: tenant.email, ...email })
              stats.rentReminders++
            } catch (e) {
              console.error('Email send failed:', e)
            }
          }
        }

        // SMS via GHL
        if (tenant.ghl_contact_id) {
          const smsDedupKey = `rent_reminder_sms:${entry.id}:${tenant.id}`
          const smsBody = rentDueReminderSMS(tenantName, entry.amount_due, entry.due_date)
          const isNew = await recordNotification(supabase, {
            landlord_id: lease.landlord_id,
            recipient_type: 'tenant',
            recipient_id: tenant.id,
            recipient_contact: tenant.phone || '',
            channel: 'sms',
            type: 'rent_reminder',
            subject: 'Rent Reminder',
            body: smsBody,
            dedup_key: smsDedupKey,
          })

          if (isNew) {
            try {
              await sendSMS({ contactId: tenant.ghl_contact_id, message: smsBody })
              stats.sms++
            } catch (e) {
              console.error('SMS send failed:', e)
            }
          }
        }
      }
    }
  }

  // 2. Overdue rent alerts (entries past grace period)
  const { data: overdueEntries } = await supabase
    .from('rent_schedule')
    .select(`
      id, due_date, amount_due,
      leases!inner(
        id, landlord_id, grace_period_days,
        units(name, properties(name)),
        lease_tenants(tenants(id, first_name, last_name, email, phone, ghl_contact_id))
      )
    `)
    .eq('status', 'overdue')

  if (overdueEntries) {
    for (const entry of overdueEntries) {
      const lease = entry.leases as any
      const graceDays = lease.grace_period_days || 5
      const dueDate = new Date(entry.due_date)
      const graceEnd = new Date(dueDate)
      graceEnd.setDate(graceEnd.getDate() + graceDays)

      if (today <= graceEnd) continue

      const tenants = lease.lease_tenants?.map((lt: any) => lt.tenants).filter(Boolean) || []
      for (const tenant of tenants) {
        if (!tenant) continue
        const tenantName = `${tenant.first_name} ${tenant.last_name}`
        const paymentLink = `${process.env.NEXT_PUBLIC_APP_URL}/portal/pay?schedule=${entry.id}`
        const dedupKey = `overdue_alert:${entry.id}:${tenant.id}`

        if (tenant.email) {
          const email = overdueRentEmail(tenantName, entry.amount_due, entry.due_date, paymentLink)
          const isNew = await recordNotification(supabase, {
            landlord_id: lease.landlord_id,
            recipient_type: 'tenant',
            recipient_id: tenant.id,
            recipient_contact: tenant.email,
            channel: 'email',
            type: 'overdue_alert',
            subject: email.subject,
            body: email.html,
            dedup_key: dedupKey,
          })

          if (isNew) {
            try {
              await sendEmail({ to: tenant.email, ...email })
              stats.overdueAlerts++
            } catch (e) {
              console.error('Email send failed:', e)
            }
          }
        }

        if (tenant.ghl_contact_id) {
          const smsDedupKey = `overdue_sms:${entry.id}:${tenant.id}`
          const smsBody = overdueAlertSMS(tenantName, entry.amount_due, entry.due_date)
          const isNew = await recordNotification(supabase, {
            landlord_id: lease.landlord_id,
            recipient_type: 'tenant',
            recipient_id: tenant.id,
            recipient_contact: tenant.phone || '',
            channel: 'sms',
            type: 'overdue_alert',
            subject: 'Overdue Rent',
            body: smsBody,
            dedup_key: smsDedupKey,
          })

          if (isNew) {
            try {
              await sendSMS({ contactId: tenant.ghl_contact_id, message: smsBody })
              stats.sms++
            } catch (e) {
              console.error('SMS send failed:', e)
            }
          }
        }
      }
    }
  }

  // 3. Lease expiry reminders (30 days before end)
  const expiryDate = new Date(today)
  expiryDate.setDate(expiryDate.getDate() + 30)
  const expiryDateStr = expiryDate.toISOString().slice(0, 10)

  const { data: expiringLeases } = await supabase
    .from('leases')
    .select(`
      id, end_date, landlord_id,
      units(name, properties(name)),
      lease_tenants(tenants(id, first_name, last_name, email))
    `)
    .eq('end_date', expiryDateStr)
    .eq('status', 'active')

  if (expiringLeases) {
    for (const lease of expiringLeases) {
      const leaseAny = lease as any
      const propertyName = `${leaseAny.units?.properties?.name} - ${leaseAny.units?.name}`
      const tenants = leaseAny.lease_tenants?.map((lt: any) => lt.tenants).filter(Boolean) || []

      for (const tenant of tenants) {
        if (!tenant?.email) continue
        const tenantName = `${tenant.first_name} ${tenant.last_name}`
        const dedupKey = `lease_expiry:${lease.id}:${tenant.id}`

        const email = leaseExpiryEmail(tenantName, propertyName, lease.end_date)
        const isNew = await recordNotification(supabase, {
          landlord_id: lease.landlord_id,
          recipient_type: 'tenant',
          recipient_id: tenant.id,
          recipient_contact: tenant.email,
          channel: 'email',
          type: 'lease_expiry',
          subject: email.subject,
          body: email.html,
          dedup_key: dedupKey,
        })

        if (isNew) {
          try {
            await sendEmail({ to: tenant.email, ...email })
            stats.leaseExpiry++
          } catch (e) {
            console.error('Email send failed:', e)
          }
        }
      }
    }
  }

  return NextResponse.json({ success: true, stats })
}
