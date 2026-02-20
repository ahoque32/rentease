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

interface EditMaintenanceFormProps {
  requestId: string
  request: {
    unit_id: string
    tenant_id: string | null
    title: string
    description: string | null
    category: string
    urgency: string
    status: string
    contractor_name: string | null
    contractor_phone: string | null
    contractor_email: string | null
    scheduled_date: string | null
    estimated_cost: number | null
    actual_cost: number | null
    notes: string | null
  }
  units: Unit[]
  tenants: Tenant[]
}

export default function EditMaintenanceForm({ requestId, request, units, tenants }: EditMaintenanceFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [unitId, setUnitId] = useState(request.unit_id)
  const [tenantId, setTenantId] = useState(request.tenant_id || '')
  const [category, setCategory] = useState(request.category)
  const [urgency, setUrgency] = useState(request.urgency)
  const [status, setStatus] = useState(request.status)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = e.currentTarget
    const formData = new FormData(form)

    if (!unitId || !category || !urgency) {
      setError('Please fill in all required fields.')
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`/api/maintenance/${requestId}`, {
        method: 'PUT',
        body: JSON.stringify({
          unit_id: unitId,
          tenant_id: tenantId || null,
          title: formData.get('title'),
          description: formData.get('description') || null,
          category,
          urgency,
          status,
          contractor_name: formData.get('contractor_name') || null,
          contractor_phone: formData.get('contractor_phone') || null,
          contractor_email: formData.get('contractor_email') || null,
          scheduled_date: formData.get('scheduled_date') || null,
          estimated_cost: formData.get('estimated_cost') ? parseFloat(formData.get('estimated_cost') as string) : null,
          actual_cost: formData.get('actual_cost') ? parseFloat(formData.get('actual_cost') as string) : null,
          notes: formData.get('notes') || null,
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to update request')
        setLoading(false)
        return
      }

      router.push(`/maintenance/${requestId}`)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/maintenance/${requestId}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Maintenance Request</CardTitle>
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
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Unit *</Label>
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
              <Label>Reported By</Label>
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

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" name="title" defaultValue={request.title} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                defaultValue={request.description ?? ''}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plumbing">Plumbing</SelectItem>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="hvac">HVAC</SelectItem>
                    <SelectItem value="appliance">Appliance</SelectItem>
                    <SelectItem value="structural">Structural</SelectItem>
                    <SelectItem value="pest">Pest</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Urgency *</Label>
                <Select value={urgency} onValueChange={setUrgency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contractor_name">Contractor Name</Label>
              <Input id="contractor_name" name="contractor_name" defaultValue={request.contractor_name ?? ''} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contractor_phone">Contractor Phone</Label>
                <Input id="contractor_phone" name="contractor_phone" defaultValue={request.contractor_phone ?? ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contractor_email">Contractor Email</Label>
                <Input id="contractor_email" name="contractor_email" type="email" defaultValue={request.contractor_email ?? ''} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduled_date">Scheduled Date</Label>
              <Input id="scheduled_date" name="scheduled_date" type="date" defaultValue={request.scheduled_date ?? ''} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimated_cost">Estimated Cost ($)</Label>
                <Input id="estimated_cost" name="estimated_cost" type="number" min="0" step="0.01" defaultValue={request.estimated_cost ?? ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="actual_cost">Actual Cost ($)</Label>
                <Input id="actual_cost" name="actual_cost" type="number" min="0" step="0.01" defaultValue={request.actual_cost ?? ''} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                defaultValue={request.notes ?? ''}
              />
            </div>

            <div className="flex gap-4">
              <Button type="button" variant="outline" asChild>
                <Link href={`/maintenance/${requestId}`}>Cancel</Link>
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
