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

export default async function NewLeasePage({
  searchParams,
}: {
  searchParams: { tenant?: string; unit?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch available units and tenants
  const { data: properties } = await supabase
    .from('properties')
    .select('id')
    .eq('landlord_id', user!.id)

  const propertyIds = properties?.map(p => p.id) || []

  const { data: units } = await supabase
    .from('units')
    .select(`
      *,
      properties(name)
    `)
    .in('property_id', propertyIds)
    .order('name')

  const { data: tenants } = await supabase
    .from('tenants')
    .select('*')
    .eq('landlord_id', user!.id)
    .in('status', ['applicant', 'active'])
    .order('last_name')

  async function createLease(formData: FormData) {
    'use server'

    const admin = createAdminClient()
    
    // Get landlord_id from the form (passed from client)
    const landlordId = formData.get('landlord_id') as string

    const leaseData = {
      landlord_id: landlordId,
      unit_id: formData.get('unit_id') as string,
      status: 'active',
      start_date: formData.get('start_date') as string,
      end_date: formData.get('end_date') as string,
      monthly_rent: parseFloat(formData.get('monthly_rent') as string),
      security_deposit: formData.get('security_deposit') ? parseFloat(formData.get('security_deposit') as string) : null,
      late_fee_amount: formData.get('late_fee_amount') ? parseFloat(formData.get('late_fee_amount') as string) : 0,
      grace_period_days: parseInt(formData.get('grace_period_days') as string) || 5,
      rent_due_day: parseInt(formData.get('rent_due_day') as string) || 1,
      notes: (formData.get('notes') as string) || null,
    }

    // Create lease
    const { data: lease, error: leaseError } = await admin
      .from('leases')
      .insert(leaseData)
      .select()
      .single()

    if (leaseError) {
      redirect('/leases/new?error=' + encodeURIComponent(leaseError.message))
    }

    // Link tenant to lease
    const tenantId = formData.get('tenant_id') as string
    if (tenantId) {
      const { error: linkError } = await admin
        .from('lease_tenants')
        .insert({
          lease_id: lease.id,
          tenant_id: tenantId,
          is_primary: true,
        })

      if (linkError) {
        console.error('Error linking tenant:', linkError)
      }

      // Update unit status to occupied
      await admin
        .from('units')
        .update({ status: 'occupied' })
        .eq('id', leaseData.unit_id)
    }

    redirect('/leases/' + lease.id)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/leases">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Lease</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createLease} className="space-y-6">
            <input type="hidden" name="landlord_id" value={user!.id} />
            <div className="space-y-2">
              <Label htmlFor="unit_id">Unit</Label>
              <Select name="unit_id" defaultValue={searchParams.unit} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a unit" />
                </SelectTrigger>
                <SelectContent>
                  {units?.map((unit: any) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.properties?.name} - {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tenant_id">Primary Tenant</Label>
              <Select name="tenant_id" defaultValue={searchParams.tenant} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a tenant" />
                </SelectTrigger>
                <SelectContent>
                  {tenants?.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.last_name}, {tenant.first_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  name="start_date"
                  type="date"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  name="end_date"
                  type="date"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthly_rent">Monthly Rent ($)</Label>
              <Input
                id="monthly_rent"
                name="monthly_rent"
                type="number"
                min="0"
                step="0.01"
                placeholder="1500.00"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="security_deposit">Security Deposit ($)</Label>
                <Input
                  id="security_deposit"
                  name="security_deposit"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="1500.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="late_fee_amount">Late Fee ($)</Label>
                <Input
                  id="late_fee_amount"
                  name="late_fee_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="50.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rent_due_day">Rent Due Day (1-31)</Label>
                <Input
                  id="rent_due_day"
                  name="rent_due_day"
                  type="number"
                  min="1"
                  max="31"
                  defaultValue="1"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="grace_period_days">Grace Period (Days)</Label>
                <Input
                  id="grace_period_days"
                  name="grace_period_days"
                  type="number"
                  min="0"
                  max="10"
                  defaultValue="5"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any additional lease terms or notes..."
              />
            </div>

            <div className="flex gap-4">
              <Button type="button" variant="outline" asChild>
                <Link href="/leases">Cancel</Link>
              </Button>
              <Button type="submit">Create Lease</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
