import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft } from 'lucide-react'

export default async function RecordPaymentPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch active leases with tenant info
  const { data: leases } = await supabase
    .from('leases')
    .select(`
      *,
      units(name, properties(name)),
      lease_tenants(tenants(id, first_name, last_name))
    `)
    .eq('landlord_id', user!.id)
    .eq('status', 'active')

  async function recordPayment(formData: FormData) {
    'use server'

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const leaseId = formData.get('lease_id') as string
    const amount = parseFloat(formData.get('amount') as string)
    const forMonth = formData.get('for_month') as string

    // Get lease details to find tenant
    const { data: lease } = await supabase
      .from('leases')
      .select(`
        *,
        lease_tenants(tenant_id)
      `)
      .eq('id', leaseId)
      .single()

    const tenantId = lease?.lease_tenants?.[0]?.tenant_id

    const paymentData = {
      lease_id: leaseId,
      tenant_id: tenantId,
      amount: amount,
      type: formData.get('type') as string,
      method: formData.get('method') as string,
      status: 'completed',
      for_month: forMonth + '-01',
      paid_at: new Date().toISOString(),
      notes: (formData.get('notes') as string) || null,
    }

    const admin = createAdminClient()

    const { error: paymentError } = await admin
      .from('payments')
      .insert(paymentData)

    if (paymentError) {
      redirect('/payments/record?error=' + encodeURIComponent(paymentError.message))
    }

    // Update rent schedule
    const { error: scheduleError } = await admin
      .from('rent_schedule')
      .update({
        amount_paid: amount,
        status: amount >= (lease?.monthly_rent || 0) ? 'paid' : 'partial'
      })
      .eq('lease_id', leaseId)
      .gte('due_date', forMonth + '-01')
      .lt('due_date', forMonth + '-31')

    if (scheduleError) {
      console.error('Error updating rent schedule:', scheduleError)
    }

    redirect('/payments')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/payments">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Record Payment</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={recordPayment} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="lease_id">Lease / Tenant</Label>
              <Select name="lease_id" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a lease" />
                </SelectTrigger>
                <SelectContent>
                  {leases?.map((lease: any) => {
                    const tenant = lease.lease_tenants?.[0]?.tenants
                    return (
                      <SelectItem key={lease.id} value={lease.id}>
                        {tenant?.last_name}, {tenant?.first_name} - {lease.units?.properties?.name} ({lease.units?.name}) - ${lease.monthly_rent}/mo
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="1500.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="for_month">For Month</Label>
                <Input
                  id="for_month"
                  name="for_month"
                  type="month"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Payment Type</Label>
                <Select name="type" defaultValue="rent">
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rent">Rent</SelectItem>
                    <SelectItem value="late_fee">Late Fee</SelectItem>
                    <SelectItem value="security_deposit">Security Deposit</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="method">Payment Method</Label>
                <Select name="method" defaultValue="cash">
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="ach">ACH/Bank Transfer</SelectItem>
                    <SelectItem value="card">Credit/Debit Card</SelectItem>
                    <SelectItem value="zelle">Zelle</SelectItem>
                    <SelectItem value="venmo">Venmo</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any notes about this payment..."
              />
            </div>

            <div className="flex gap-4">
              <Button type="button" variant="outline" asChild>
                <Link href="/payments">Cancel</Link>
              </Button>
              <Button type="submit">Record Payment</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
