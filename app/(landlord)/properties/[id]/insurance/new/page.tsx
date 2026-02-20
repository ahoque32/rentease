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

interface PageProps {
  params: { id: string }
}

export default async function NewInsurancePage({ params }: PageProps) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Verify property exists and belongs to landlord
  const { data: property } = await supabase
    .from('properties')
    .select('name')
    .eq('id', params.id)
    .eq('landlord_id', user!.id)
    .single()

  if (!property) {
    redirect('/properties')
  }

  async function createInsurance(formData: FormData) {
    'use server'

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const insuranceData = {
      property_id: params.id,
      landlord_id: user!.id,
      type: formData.get('type') as string,
      provider_name: formData.get('provider_name') as string,
      policy_number: (formData.get('policy_number') as string) || null,
      coverage_amount: formData.get('coverage_amount') ? parseFloat(formData.get('coverage_amount') as string) : null,
      premium_amount: formData.get('premium_amount') ? parseFloat(formData.get('premium_amount') as string) : null,
      premium_frequency: formData.get('premium_frequency') as string,
      start_date: (formData.get('start_date') as string) || null,
      renewal_date: (formData.get('renewal_date') as string) || null,
      notes: (formData.get('notes') as string) || null,
    }

    const admin = createAdminClient()

    const { error } = await admin
      .from('insurance_policies')
      .insert(insuranceData)

    if (error) {
      redirect(`/properties/${params.id}/insurance/new?error=` + encodeURIComponent(error.message))
    }

    redirect(`/properties/${params.id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/properties/${params.id}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Insurance Policy to {property.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createInsurance} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="type">Insurance Type</Label>
              <Select name="type" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select insurance type" />
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
              <Label htmlFor="provider_name">Insurance Provider</Label>
              <Input
                id="provider_name"
                name="provider_name"
                placeholder="e.g., State Farm, Allstate"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="policy_number">Policy Number (Optional)</Label>
              <Input
                id="policy_number"
                name="policy_number"
                placeholder="Policy number"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="coverage_amount">Coverage Amount ($)</Label>
                <Input
                  id="coverage_amount"
                  name="coverage_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="250000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="premium_amount">Premium Amount ($)</Label>
                <Input
                  id="premium_amount"
                  name="premium_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="1200"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="premium_frequency">Premium Frequency</Label>
              <Select name="premium_frequency" defaultValue="annual">
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="semi_annual">Semi-Annual</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Policy Start Date (Optional)</Label>
                <Input
                  id="start_date"
                  name="start_date"
                  type="date"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="renewal_date">Renewal Date</Label>
                <Input
                  id="renewal_date"
                  name="renewal_date"
                  type="date"
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
                placeholder="Any notes about this policy..."
              />
            </div>

            <div className="flex gap-4">
              <Button type="button" variant="outline" asChild>
                <Link href={`/properties/${params.id}`}>Cancel</Link>
              </Button>
              <Button type="submit">Add Policy</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
