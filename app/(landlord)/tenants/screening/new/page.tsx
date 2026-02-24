import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, AlertCircle } from 'lucide-react'

interface NewSurveyPageProps {
  searchParams?: { error?: string }
}

export default async function NewSurveyPage({ searchParams }: NewSurveyPageProps) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: properties } = await supabase
    .from('properties')
    .select('id, name')
    .eq('landlord_id', user!.id)
    .eq('archived', false)

  const { data: units } = await supabase
    .from('units')
    .select('id, name, property_id, properties(id, name)')
    .in('property_id', properties?.map(p => p.id) || [])

  async function createSurvey(formData: FormData) {
    'use server'

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const surveyData = {
      landlord_id: user!.id,
      title: formData.get('title') as string,
      description: (formData.get('description') as string) || null,
      property_id: (formData.get('property_id') as string) || null,
      unit_id: (formData.get('unit_id') as string) || null,
      status: 'active',
    }

    const admin = createAdminClient()
    const { data, error } = await admin.from('screening_surveys').insert(surveyData).select().single()

    if (error) redirect('/tenants/screening/new?error=' + encodeURIComponent(error.message))
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
          {searchParams?.error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex gap-2" role="alert">
              <AlertCircle className="w-4 h-4 mt-0.5" />
              <span>{decodeURIComponent(searchParams.error)}</span>
            </div>
          )}

          <form action={createSurvey} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Survey Title</Label>
              <Input id="title" name="title" placeholder="e.g., Oakwood Apartments - 2BR Unit" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                name="description"
                rows={3}
                placeholder="Any additional information for applicants..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="property_id">Property (Optional)</Label>
              <select id="property_id" name="property_id" className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">None</option>
                {properties?.map((property) => (
                  <option key={property.id} value={property.id}>{property.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit_id">Unit (Optional)</Label>
              <select id="unit_id" name="unit_id" className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="">None</option>
                {units?.map((unit: any) => (
                  <option key={unit.id} value={unit.id}>{unit.properties?.name} - {unit.name}</option>
                ))}
              </select>
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
