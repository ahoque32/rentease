'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft } from 'lucide-react'

interface Unit {
  id: string
  name: string
  properties: { name: string } | null
}

interface Tenant {
  id: string
  first_name: string
  last_name: string
}

interface EditLeaseFormProps {
  leaseId: string
  lease: {
    unit_id: string
    start_date: string
    end_date: string
    monthly_rent: number
    security_deposit: number | null
    late_fee_amount: number | null
    grace_period_days: number
    rent_due_day: number
    notes: string | null
    status: string
  }
  currentTenantId: string
  units: Unit[]
  tenants: Tenant[]
}

export default function EditLeaseForm({ leaseId, lease, currentTenantId, units, tenants }: EditLeaseFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [unitId, setUnitId] = useState(lease.unit_id)
  const [tenantId, setTenantId] = useState(currentTenantId)
  const [status, setStatus] = useState(lease.status)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = e.currentTarget
    const formData = new FormData(form)

    if (!unitId || !tenantId) {
      setError('Please select a unit and tenant.')
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`/api/leases/${leaseId}`, {
        method: 'PUT',
        body: JSON.stringify({
          unit_id: unitId,
          tenant_id: tenantId,
          status,
          start_date: formData.get('start_date'),
          end_date: formData.get('end_date'),
          monthly_rent: parseFloat(formData.get('monthly_rent') as string),
          security_deposit: formData.get('security_deposit') ? parseFloat(formData.get('security_deposit') as string) : null,
          late_fee_amount: formData.get('late_fee_amount') ? parseFloat(formData.get('late_fee_amount') as string) : 0,
          grace_period_days: parseInt(formData.get('grace_period_days') as string) || 5,
          rent_due_day: parseInt(formData.get('rent_due_day') as string) || 1,
          notes: formData.get('notes') || null,
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to update lease')
        setLoading(false)
        return
      }

      router.push(`/leases/${leaseId}`)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/leases/${leaseId}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Lease</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expiring">Expiring</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Unit</Label>
              <Select value={unitId} onValueChange={setUnitId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a unit" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.properties?.name} - {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Primary Tenant</Label>
              <Select value={tenantId} onValueChange={setTenantId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a tenant" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant) => (
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
                <Input id="start_date" name="start_date" type="date" defaultValue={lease.start_date} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input id="end_date" name="end_date" type="date" defaultValue={lease.end_date} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="monthly_rent">Monthly Rent ($)</Label>
              <Input id="monthly_rent" name="monthly_rent" type="number" min="0" step="0.01" defaultValue={lease.monthly_rent} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="security_deposit">Security Deposit ($)</Label>
                <Input id="security_deposit" name="security_deposit" type="number" min="0" step="0.01" defaultValue={lease.security_deposit ?? ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="late_fee_amount">Late Fee ($)</Label>
                <Input id="late_fee_amount" name="late_fee_amount" type="number" min="0" step="0.01" defaultValue={lease.late_fee_amount ?? ''} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rent_due_day">Rent Due Day (1-31)</Label>
                <Input id="rent_due_day" name="rent_due_day" type="number" min="1" max="31" defaultValue={lease.rent_due_day} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grace_period_days">Grace Period (Days)</Label>
                <Input id="grace_period_days" name="grace_period_days" type="number" min="0" max="10" defaultValue={lease.grace_period_days} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                defaultValue={lease.notes ?? ''}
              />
            </div>

            <div className="flex gap-4">
              <Button type="button" variant="outline" asChild>
                <Link href={`/leases/${leaseId}`}>Cancel</Link>
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
