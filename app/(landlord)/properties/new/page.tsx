import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SubmitButton } from '@/components/ui/submit-button'
import { FormError } from '@/components/shared/FormError'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft } from 'lucide-react'

interface NewPropertyPageProps {
  searchParams?: { error?: string }
}

export default function NewPropertyPage({ searchParams }: NewPropertyPageProps) {
  async function createProperty(formData: FormData) {
    'use server'

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const propertyData = {
      landlord_id: user.id,
      name: formData.get('name') as string,
      address_line1: formData.get('address_line1') as string,
      address_line2: formData.get('address_line2') as string || null,
      city: formData.get('city') as string,
      state: formData.get('state') as string,
      zip: formData.get('zip') as string,
      type: formData.get('type') as string,
      notes: formData.get('notes') as string || null,
      zillow_url: formData.get('zillow_url') as string || null,
    }

    const admin = createAdminClient()

    const { data, error } = await admin
      .from('properties')
      .insert(propertyData)
      .select()
      .single()

    if (error) {
      console.error('Property insert failed:', error)
      redirect('/properties/new?error=' + encodeURIComponent('Could not create the property. Please check the form and try again.'))
    }

    redirect('/properties/' + data.id)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/properties">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Property</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createProperty} className="space-y-6">
            <FormError message={searchParams?.error} />
            <div className="space-y-2">
              <Label htmlFor="name">Property Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Oakwood Apartments"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address_line1">Street Address</Label>
              <Input
                id="address_line1"
                name="address_line1"
                placeholder="123 Main St"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address_line2">Apartment, Suite, etc. (Optional)</Label>
              <Input
                id="address_line2"
                name="address_line2"
                placeholder="Apt 4B"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" placeholder="New York" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" name="state" placeholder="NY" maxLength={2} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="zip">ZIP Code</Label>
                <Input id="zip" name="zip" placeholder="10001" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Property Type</Label>
              <Select name="type" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single_family">Single Family</SelectItem>
                  <SelectItem value="multi_family">Multi Family</SelectItem>
                  <SelectItem value="condo">Condo</SelectItem>
                  <SelectItem value="townhouse">Townhouse</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="zillow_url">Zillow Listing URL (Optional)</Label>
              <Input
                id="zillow_url"
                name="zillow_url"
                type="url"
                placeholder="https://www.zillow.com/homedetails/..."
              />
              <p className="text-xs text-gray-500">Add a Zillow listing URL to display property details and embed the listing.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={3}
                placeholder="Any additional notes about this property..."
              />
            </div>

            <div className="flex gap-4">
              <Button type="button" variant="outline" asChild>
                <Link href="/properties">Cancel</Link>
              </Button>
              <SubmitButton loadingText="Creating Property...">Create Property</SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
