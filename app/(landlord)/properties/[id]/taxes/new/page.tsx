import { createClient } from '@/lib/supabase/server'
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

export default async function NewTaxPage({ params }: PageProps) {
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

  async function createTax(formData: FormData) {
    'use server'

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Build due_dates JSON from the form inputs
    const dueDates = []
    let i = 0
    while (formData.get(`due_date_${i}`)) {
      dueDates.push({
        date: formData.get(`due_date_${i}`),
        amount: formData.get(`due_amount_${i}`) ? parseFloat(formData.get(`due_amount_${i}`) as string) : null,
        status: 'due'
      })
      i++
    }

    const taxData = {
      property_id: params.id,
      landlord_id: user!.id,
      tax_year: parseInt(formData.get('tax_year') as string),
      annual_amount: parseFloat(formData.get('annual_amount') as string),
      assessor_parcel_number: (formData.get('assessor_parcel_number') as string) || null,
      tax_authority: (formData.get('tax_authority') as string) || null,
      due_dates: dueDates.length > 0 ? dueDates : null,
      payment_status: formData.get('payment_status') as string,
      notes: (formData.get('notes') as string) || null,
    }

    const { error } = await supabase
      .from('property_taxes')
      .insert(taxData)

    if (error) {
      redirect(`/properties/${params.id}/taxes/new?error=` + encodeURIComponent(error.message))
    }

    redirect(`/properties/${params.id}`)
  }

  const currentYear = new Date().getFullYear()

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
          <CardTitle>Add Tax Record for {property.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createTax} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tax_year">Tax Year</Label>
                <Input
                  id="tax_year"
                  name="tax_year"
                  type="number"
                  min="2000"
                  max="2100"
                  defaultValue={currentYear}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="annual_amount">Annual Tax Amount ($)</Label>
                <Input
                  id="annual_amount"
                  name="annual_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="5000.00"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assessor_parcel_number">Parcel Number (Optional)</Label>
                <Input
                  id="assessor_parcel_number"
                  name="assessor_parcel_number"
                  placeholder="e.g., 12345-6789"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax_authority">Tax Authority (Optional)</Label>
                <Input
                  id="tax_authority"
                  name="tax_authority"
                  placeholder="e.g., County Tax Office"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_status">Payment Status</Label>
              <Select name="payment_status" defaultValue="due">
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="due">Due</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Due Dates (Optional)</Label>
              <p className="text-sm text-gray-500">Add due dates for installment payments</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="due_date_0" className="text-sm">Due Date 1</Label>
                  <Input
                    id="due_date_0"
                    name="due_date_0"
                    type="date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due_amount_0" className="text-sm">Amount</Label>
                  <Input
                    id="due_amount_0"
                    name="due_amount_0"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="2500.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="due_date_1" className="text-sm">Due Date 2</Label>
                  <Input
                    id="due_date_1"
                    name="due_date_1"
                    type="date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due_amount_1" className="text-sm">Amount</Label>
                  <Input
                    id="due_amount_1"
                    name="due_amount_1"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="2500.00"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any notes about property taxes..."
              />
            </div>

            <div className="flex gap-4">
              <Button type="button" variant="outline" asChild>
                <Link href={`/properties/${params.id}`}>Cancel</Link>
              </Button>
              <Button type="submit">Add Tax Record</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
