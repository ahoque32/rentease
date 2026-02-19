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

export default async function NewSystemPage({ params }: PageProps) {
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

  async function createSystem(formData: FormData) {
    'use server'

    const supabase = createClient()

    const systemData = {
      property_id: params.id,
      system_type: formData.get('system_type') as string,
      manufacturer: (formData.get('manufacturer') as string) || null,
      model: (formData.get('model') as string) || null,
      install_date: (formData.get('install_date') as string) || null,
      condition: formData.get('condition') as string,
      last_serviced_date: (formData.get('last_serviced_date') as string) || null,
      next_service_due: (formData.get('next_service_due') as string) || null,
      service_interval_months: formData.get('service_interval_months') ? parseInt(formData.get('service_interval_months') as string) : null,
      notes: (formData.get('notes') as string) || null,
    }

    const { error } = await supabase
      .from('property_systems')
      .insert(systemData)

    if (error) {
      redirect(`/properties/${params.id}/systems/new?error=` + encodeURIComponent(error.message))
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
          <CardTitle>Add System to {property.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createSystem} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="system_type">System Type</Label>
              <Select name="system_type" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select system type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hvac">HVAC</SelectItem>
                  <SelectItem value="septic">Septic</SelectItem>
                  <SelectItem value="roof">Roof</SelectItem>
                  <SelectItem value="electrical">Electrical</SelectItem>
                  <SelectItem value="plumbing">Plumbing</SelectItem>
                  <SelectItem value="appliance">Appliance</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manufacturer">Manufacturer (Optional)</Label>
                <Input
                  id="manufacturer"
                  name="manufacturer"
                  placeholder="e.g., Carrier, Trane"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model (Optional)</Label>
                <Input
                  id="model"
                  name="model"
                  placeholder="e.g., Infinity 26"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="condition">Condition</Label>
              <Select name="condition" defaultValue="good">
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="install_date">Install Date (Optional)</Label>
                <Input
                  id="install_date"
                  name="install_date"
                  type="date"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="service_interval_months">Service Interval (Months)</Label>
                <Input
                  id="service_interval_months"
                  name="service_interval_months"
                  type="number"
                  min="1"
                  placeholder="12"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="last_serviced_date">Last Serviced (Optional)</Label>
                <Input
                  id="last_serviced_date"
                  name="last_serviced_date"
                  type="date"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="next_service_due">Next Service Due (Optional)</Label>
                <Input
                  id="next_service_due"
                  name="next_service_due"
                  type="date"
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
                placeholder="Any notes about this system..."
              />
            </div>

            <div className="flex gap-4">
              <Button type="button" variant="outline" asChild>
                <Link href={`/properties/${params.id}`}>Cancel</Link>
              </Button>
              <Button type="submit">Add System</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
