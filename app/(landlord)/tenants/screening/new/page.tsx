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

export default async function NewSurveyPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch properties and units for dropdown
  const { data: properties } = await supabase
    .from('properties')
    .select('id, name')
    .eq('landlord_id', user!.id)
    .eq('archived', false)

  const { data: units } = await supabase
    .from('units')
    .select('id, name, properties(id, name)')
    .in('property_id', properties?.map(p => p.id) || [])

  async function createSurvey(formData: FormData) {
    'use server'

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const surveyData = {
      landlord_id: user!.id,
      title: formData.get('title') as string,
      description: formData.get('description') as string || null,
      property_id: formData.get('property_id') as string || null,
      unit_id: formData.get('unit_id') as string || null,
      status: 'active',
    }

    const admin = createAdminClient()

    const { data, error } = await admin
      .from('screening_surveys')
      .insert(surveyData)
      .select()
      .single()

    if (error) {
      redirect('/tenants/screening/new?error=' + encodeURIComponent(error.message))
    }

    redirect('/tenants/screening/' + data.id)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/tenants/screening">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Screening Survey</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createSurvey} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Survey Title</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., Oakwood Apartments - 2BR Unit"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any additional information for applicants..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="property_id">Property (Optional)</Label>
              <Select name="property_id">
                <SelectTrigger>
                  <SelectValue placeholder="Select a property" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {properties?.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit_id">Unit (Optional)</Label>
              <Select name="unit_id">
                <SelectTrigger>
                  <SelectValue placeholder="Select a unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {units?.map((unit: any) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.properties?.name} - {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-4">
              <Button type="button" variant="outline" asChild>
                <Link href="/tenants/screening">Cancel</Link>
              </Button>
              <Button type="submit">Create Survey</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}