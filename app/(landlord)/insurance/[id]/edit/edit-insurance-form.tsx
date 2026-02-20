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

interface Property {
  id: string
  name: string
}

interface EditInsuranceFormProps {
  policyId: string
  policy: {
    property_id: string
    type: string
    provider_name: string
    policy_number: string | null
    coverage_amount: number | null
    premium_amount: number | null
    premium_frequency: string
    start_date: string | null
    renewal_date: string | null
    notes: string | null
  }
  properties: Property[]
}

export default function EditInsuranceForm({ policyId, policy, properties }: EditInsuranceFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [propertyId, setPropertyId] = useState(policy.property_id)
  const [type, setType] = useState(policy.type)
  const [premiumFrequency, setPremiumFrequency] = useState(policy.premium_frequency || 'annual')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = e.currentTarget
    const formData = new FormData(form)

    if (!propertyId || !type) {
      setError('Please select a property and policy type.')
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`/api/insurance/${policyId}`, {
        method: 'PUT',
        body: JSON.stringify({
          property_id: propertyId,
          type,
          provider_name: formData.get('provider_name'),
          policy_number: formData.get('policy_number') || null,
          coverage_amount: formData.get('coverage_amount') ? parseFloat(formData.get('coverage_amount') as string) : null,
          premium_amount: formData.get('premium_amount') ? parseFloat(formData.get('premium_amount') as string) : null,
          premium_frequency: premiumFrequency,
          start_date: formData.get('start_date') || null,
          renewal_date: formData.get('renewal_date') || null,
          notes: formData.get('notes') || null,
        }),
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to update policy')
        setLoading(false)
        return
      }

      router.push(`/insurance/${policyId}`)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/insurance/${policyId}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit Insurance Policy</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Property *</Label>
              <Select value={propertyId} onValueChange={setPropertyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Policy Type *</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="disaster">Disaster</SelectItem>
                  <SelectItem value="repair">Repair</SelectItem>
                  <SelectItem value="tax">Tax</SelectItem>
                  <SelectItem value="home_warranty">Home Warranty</SelectItem>
                  <SelectItem value="liability">Liability</SelectItem>
                  <SelectItem value="flood">Flood</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider_name">Provider Name *</Label>
              <Input id="provider_name" name="provider_name" defaultValue={policy.provider_name} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="policy_number">Policy Number</Label>
              <Input id="policy_number" name="policy_number" defaultValue={policy.policy_number ?? ''} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverage_amount">Coverage Amount ($)</Label>
              <Input id="coverage_amount" name="coverage_amount" type="number" min="0" step="0.01" defaultValue={policy.coverage_amount ?? ''} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="premium_amount">Premium Amount ($)</Label>
                <Input id="premium_amount" name="premium_amount" type="number" min="0" step="0.01" defaultValue={policy.premium_amount ?? ''} />
              </div>
              <div className="space-y-2">
                <Label>Premium Frequency</Label>
                <Select value={premiumFrequency} onValueChange={setPremiumFrequency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="semi_annual">Semi-Annual</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input id="start_date" name="start_date" type="date" defaultValue={policy.start_date ?? ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="renewal_date">Renewal Date</Label>
                <Input id="renewal_date" name="renewal_date" type="date" defaultValue={policy.renewal_date ?? ''} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                defaultValue={policy.notes ?? ''}
              />
            </div>

            <div className="flex gap-4">
              <Button type="button" variant="outline" asChild>
                <Link href={`/insurance/${policyId}`}>Cancel</Link>
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
