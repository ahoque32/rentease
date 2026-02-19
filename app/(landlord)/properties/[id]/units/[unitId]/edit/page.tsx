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
  params: { id: string; unitId: string }
}

export default async function EditUnitPage({ params }: PageProps) {
  const supabase = createClient()
  const user = { id: '00000000-0000-0000-0000-000000000001', email: 'demo@rentease.app', user_metadata: { full_name: 'Demo Landlord' } }

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

  // Fetch unit
  const { data: unit } = await supabase
    .from('units')
    .select('*')
    .eq('id', params.unitId)
    .eq('property_id', params.id)
    .single()

  if (!unit) {
    redirect(`/properties/${params.id}`)
  }

  async function updateUnit(formData: FormData) {
    'use server'

    const supabase = createClient()

    const unitData = {
      name: formData.get('name') as string,
      bedrooms: formData.get('bedrooms') ? parseInt(formData.get('bedrooms') as string) : null,
      bathrooms: formData.get('bathrooms') ? parseFloat(formData.get('bathrooms') as string) : null,
      sqft: formData.get('sqft') ? parseInt(formData.get('sqft') as string) : null,
      status: formData.get('status') as string,
      notes: (formData.get('notes') as string) || null,
    }

    const { error } = await supabase
      .from('units')
      .update(unitData)
      .eq('id', params.unitId)

    if (error) {
      redirect(`/properties/${params.id}/units/${params.unitId}/edit?error=` + encodeURIComponent(error.message))
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
          <CardTitle>Edit Unit: {unit.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateUnit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Unit Name/Number</Label>
              <Input
                id="name"
                name="name"
                defaultValue={unit.name}
                placeholder="e.g., Unit A, Apt 101, Suite 1"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input
                  id="bedrooms"
                  name="bedrooms"
                  type="number"
                  min="0"
                  defaultValue={unit.bedrooms || ''}
                  placeholder="2"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Input
                  id="bathrooms"
                  name="bathrooms"
                  type="number"
                  min="0"
                  step="0.5"
                  defaultValue={unit.bathrooms || ''}
                  placeholder="1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sqft">Square Feet</Label>
                <Input
                  id="sqft"
                  name="sqft"
                  type="number"
                  min="0"
                  defaultValue={unit.sqft || ''}
                  placeholder="1000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue={unit.status} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vacant">Vacant</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                  <SelectItem value="maintenance">Under Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                defaultValue={unit.notes || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any notes about this unit..."
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
