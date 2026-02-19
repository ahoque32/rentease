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

export default async function EditPropertyPage({ params }: PageProps) {
  const supabase = createClient()
  const user = { id: '00000000-0000-0000-0000-000000000001', email: 'demo@rentease.app', user_metadata: { full_name: 'Demo Landlord' } }

  // Fetch property
  const { data: property } = await supabase
    .from('properties')
    .select('*')
    .eq('id', params.id)
    .eq('landlord_id', user!.id)
    .single()

  if (!property) {
    redirect('/properties')
  }

  async function updateProperty(formData: FormData) {
    'use server'

    const supabase = createClient()

    const propertyData = {
      name: formData.get('name') as string,
      address_line1: formData.get('address_line1') as string,
      address_line2: (formData.get('address_line2') as string) || null,
      city: formData.get('city') as string,
      state: formData.get('state') as string,
      zip: formData.get('zip') as string,
      type: formData.get('type') as string,
      notes: (formData.get('notes') as string) || null,
    }

    const { error } = await supabase
      .from('properties')
      .update(propertyData)
      .eq('id', params.id)

    if (error) {
      redirect(`/properties/${params.id}/edit?error=` + encodeURIComponent(error.message))
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
          <CardTitle>Edit Property</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateProperty} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Property Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={property.name}
                placeholder="e.g., Oakwood Apartments"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address_line1">Street Address</Label>
              <Input
                id="address_line1"
                name="address_line1"
                defaultValue={property.address_line1}
                placeholder="123 Main St"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address_line2">Apartment, Suite, etc. (Optional)</Label>
              <Input
                id="address_line2"
                name="address_line2"
                defaultValue={property.address_line2 || ''}
                placeholder="Apt 4B"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="city">City</Label>
                <Input 
                  id="city" 
                  name="city" 
                  defaultValue={property.city}
                  placeholder="New York" 
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input 
                  id="state" 
                  name="state" 
                  defaultValue={property.state}
                  placeholder="NY" 
                  maxLength={2} 
                  required 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="zip">ZIP Code</Label>
                <Input 
                  id="zip" 
                  name="zip" 
                  defaultValue={property.zip}
                  placeholder="10001" 
                  required 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Property Type</Label>
              <Select name="type" defaultValue={property.type} required>
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
              <Label htmlFor="notes">Notes (Optional)</Label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                defaultValue={property.notes || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any additional notes about this property..."
              />
            </div>

            <div className="flex gap-4">
              <Button type="button" variant="outline" asChild>
                <Link href={`/properties/${params.id}`}>Cancel</Link>
              </Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
