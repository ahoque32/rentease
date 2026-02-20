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

interface InsuranceFormProps {
  userId: string
  properties: Property[]
  defaultProperty?: string
}

export default function InsuranceForm({ userId, properties, defaultProperty }: InsuranceFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [propertyId, setPropertyId] = useState(defaultProperty || '')
  const [type, setType] = useState('')
  const [premiumFrequency, setPremiumFrequency] = useState('annual')

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

    const providerName = formData.get('provider_name') as string
    if (!providerName?.trim()) {
      setError('Please enter a provider name.')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/insurance', {
        method: 'POST',
        body: JSON.stringify({
          landlord_id: userId,
          property_id: propertyId,
          type,
          provider_name: providerName.trim(),
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
        setError(data.error || 'Failed to create policy')
        setLoading(false)
        return
      }

      router.push('/insurance/' + data.id)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/insurance">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Insurance Policy</CardTitle>
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
              <Select value={propertyId} onValueChange={setPropertyId} required>
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
              <Select value={type} onValueChange={setType} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
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
              <Input id="provider_name" name="provider_name" placeholder="e.g. State Farm" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="policy_number">Policy Number</Label>
              <Input id="policy_number" name="policy_number" placeholder="e.g. POL-123456" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="coverage_amount">Coverage Amount ($)</Label>
              <Input id="coverage_amount" name="coverage_amount" type="number" min="0" step="0.01" placeholder="250000.00" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="premium_amount">Premium Amount ($)</Label>
                <Input id="premium_amount" name="premium_amount" type="number" min="0" step="0.01" placeholder="1200.00" />
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
                <Input id="start_date" name="start_date" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="renewal_date">Renewal Date</Label>
                <Input id="renewal_date" name="renewal_date" type="date" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any additional notes about this policy..."
              />
            </div>

            <div className="flex gap-4">
              <Button type="button" variant="outline" asChild>
                <Link href="/insurance">Cancel</Link>
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Add Policy'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
