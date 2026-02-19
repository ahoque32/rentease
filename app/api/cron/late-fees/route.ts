import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServiceSupabase()
  const today = new Date().toISOString().slice(0, 10)

  // Find overdue rent_schedule entries that haven't had late fees applied yet
  // Join with leases to get grace_period_days and late_fee_amount
  const { data: overdueEntries } = await supabase
    .from('rent_schedule')
    .select(`
      id, due_date, amount_due, amount_paid, late_fee_applied, status,
      leases!inner(id, grace_period_days, late_fee_amount, landlord_id)
    `)
    .in('status', ['due', 'overdue', 'partial'])
    .lt('due_date', today)
    .eq('late_fee_applied', 0)

  let applied = 0

  if (overdueEntries) {
    for (const entry of overdueEntries) {
      const lease = entry.leases as any
      const graceDays = lease.grace_period_days || 5
      const lateFee = lease.late_fee_amount || 0

      if (lateFee <= 0) continue

      // Check if past grace period
      const dueDate = new Date(entry.due_date)
      const graceEnd = new Date(dueDate)
      graceEnd.setDate(graceEnd.getDate() + graceDays)

      if (new Date(today) > graceEnd) {
        await supabase
          .from('rent_schedule')
          .update({
            late_fee_applied: lateFee,
            status: 'overdue',
          })
          .eq('id', entry.id)

        applied++
      }
    }
  }

  return NextResponse.json({ success: true, lateFeesApplied: applied })
}
