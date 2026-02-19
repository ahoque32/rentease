import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  Building2, 
  MapPin, 
  Home, 
  Users, 
  Wrench, 
  Shield, 
  Receipt,
  Edit,
  Archive,
  Plus
} from 'lucide-react'

interface PageProps {
  params: { id: string }
}

export default async function PropertyDetailPage({ params }: PageProps) {
  const supabase = createClient()
  const user = { id: '00000000-0000-0000-0000-000000000001', email: 'demo@rentease.app', user_metadata: { full_name: 'Demo Landlord' } }

  // Fetch property with all related data
  const { data: property } = await supabase
    .from('properties')
    .select(`
      *,
      units(*),
      insurance_policies(*),
      property_taxes(*),
      property_systems(*)
    `)
    .eq('id', params.id)
    .eq('landlord_id', user!.id)
    .single()

  if (!property) {
    redirect('/properties')
  }

  // Fetch leases for this property's units
  const unitIds = property.units?.map((u: { id: string }) => u.id) || []
  const { data: leases } = await supabase
    .from('leases')
    .select(`
      *,
      lease_tenants(tenants(*))
    `)
    .in('unit_id', unitIds)
    .eq('status', 'active')

  // Calculate stats
  const totalUnits = property.units?.length || 0
  const occupiedUnits = property.units?.filter((u: { status: string }) => u.status === 'occupied').length || 0
  const vacantUnits = totalUnits - occupiedUnits

  async function archiveProperty() {
    'use server'
    const supabase = createClient()
    
    const { error } = await supabase
      .from('properties')
      .update({ archived: true })
      .eq('id', params.id)

    if (error) {
      throw error
    }

    redirect('/properties')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link href="/properties">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Properties
            </Link>
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">{property.name}</h1>
          <div className="flex items-center gap-1 text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>{property.address_line1}, {property.city}, {property.state} {property.zip}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/properties/${params.id}/edit`}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Link>
          </Button>
          <form action={archiveProperty}>
            <Button type="submit" variant="outline" className="text-red-600 hover:text-red-700">
              <Archive className="w-4 h-4 mr-2" />
              Archive
            </Button>
          </form>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{totalUnits}</div>
            <p className="text-sm text-gray-600">Total Units</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{occupiedUnits}</div>
            <p className="text-sm text-gray-600">Occupied</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{vacantUnits}</div>
            <p className="text-sm text-gray-600">Vacant</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="units" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto">
          <TabsTrigger value="units">Units</TabsTrigger>
          <TabsTrigger value="systems">Systems</TabsTrigger>
          <TabsTrigger value="insurance">Insurance</TabsTrigger>
          <TabsTrigger value="taxes">Taxes</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        {/* Units Tab */}
        <TabsContent value="units" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Units</h3>
            <Button asChild size="sm">
              <Link href={`/properties/${params.id}/units/new`}>
                <Plus className="w-4 h-4 mr-2" />
                Add Unit
              </Link>
            </Button>
          </div>
          
          {property.units?.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <Home className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No units added yet</p>
                <Button asChild>
                  <Link href={`/properties/${params.id}/units/new`}>Add First Unit</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {property.units?.map((unit: any) => {
                const unitLease = leases?.find((l: any) => l.unit_id === unit.id)
                const tenant = unitLease?.lease_tenants?.[0]?.tenants

                return (
                  <Card key={unit.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Home className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{unit.name}</h4>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              {unit.bedrooms && <span>{unit.bedrooms} bed</span>}
                              {unit.bathrooms && <span>{unit.bathrooms} bath</span>}
                              {unit.sqft && <span>{unit.sqft} sqft</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant={unit.status === 'occupied' ? 'default' : unit.status === 'maintenance' ? 'destructive' : 'secondary'}>
                            {unit.status}
                          </Badge>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/properties/${params.id}/units/${unit.id}/edit`}>
                              <Edit className="w-4 h-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                      {tenant && (
                        <div className="mt-3 pt-3 border-t flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">Tenant:</span>
                          <Link href={`/tenants/${tenant.id}`} className="text-blue-600 hover:underline">
                            {tenant.first_name} {tenant.last_name}
                          </Link>
                          {unitLease?.monthly_rent && (
                            <span className="text-gray-500 ml-2">${unitLease.monthly_rent}/mo</span>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Systems Tab */}
        <TabsContent value="systems" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Property Systems</h3>
            <Button asChild size="sm">
              <Link href={`/properties/${params.id}/systems/new`}>
                <Plus className="w-4 h-4 mr-2" />
                Add System
              </Link>
            </Button>
          </div>

          {property.property_systems?.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No systems recorded</p>
                <Button asChild>
                  <Link href={`/properties/${params.id}/systems/new`}>Add First System</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {property.property_systems?.map((system: any) => (
                <Card key={system.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold capitalize">{system.system_type.replace('_', ' ')}</h4>
                        {system.manufacturer && (
                          <p className="text-sm text-gray-600">
                            {system.manufacturer} {system.model}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          system.condition === 'good' ? 'default' :
                          system.condition === 'fair' ? 'secondary' :
                          system.condition === 'poor' ? 'outline' :
                          'destructive'
                        }>
                          {system.condition}
                        </Badge>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/properties/${params.id}/systems/${system.id}/edit`}>
                            <Edit className="w-4 h-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-4 text-sm">
                      {system.install_date && (
                        <div>
                          <span className="text-gray-500">Installed:</span>
                          <span className="ml-2">{new Date(system.install_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      {system.last_serviced_date && (
                        <div>
                          <span className="text-gray-500">Last Service:</span>
                          <span className="ml-2">{new Date(system.last_serviced_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      {system.next_service_due && (
                        <div>
                          <span className="text-gray-500">Next Service:</span>
                          <span className={`ml-2 ${new Date(system.next_service_due) < new Date() ? 'text-red-600' : ''}`}>
                            {new Date(system.next_service_due).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Insurance Tab */}
        <TabsContent value="insurance" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Insurance Policies</h3>
            <Button asChild size="sm">
              <Link href={`/properties/${params.id}/insurance/new`}>
                <Plus className="w-4 h-4 mr-2" />
                Add Policy
              </Link>
            </Button>
          </div>

          {property.insurance_policies?.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No insurance policies recorded</p>
                <Button asChild>
                  <Link href={`/properties/${params.id}/insurance/new`}>Add First Policy</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {property.insurance_policies?.map((policy: any) => (
                <Card key={policy.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{policy.provider_name}</h4>
                        <p className="text-sm text-gray-600 capitalize">{policy.type.replace('_', ' ')} Insurance</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {policy.renewal_date && (
                          <Badge variant={
                            new Date(policy.renewal_date) < new Date() ? 'destructive' :
                            new Date(policy.renewal_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? 'outline' :
                            'default'
                          }>
                            Renews {new Date(policy.renewal_date).toLocaleDateString()}
                          </Badge>
                        )}
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/properties/${params.id}/insurance/${policy.id}/edit`}>
                            <Edit className="w-4 h-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-4 text-sm">
                      {policy.coverage_amount && (
                        <div>
                          <span className="text-gray-500">Coverage:</span>
                          <span className="ml-2 font-medium">${policy.coverage_amount.toLocaleString()}</span>
                        </div>
                      )}
                      {policy.premium_amount && (
                        <div>
                          <span className="text-gray-500">Premium:</span>
                          <span className="ml-2">${policy.premium_amount}/{policy.premium_frequency}</span>
                        </div>
                      )}
                      {policy.policy_number && (
                        <div>
                          <span className="text-gray-500">Policy #:</span>
                          <span className="ml-2">{policy.policy_number}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Taxes Tab */}
        <TabsContent value="taxes" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Property Taxes</h3>
            <Button asChild size="sm">
              <Link href={`/properties/${params.id}/taxes/new`}>
                <Plus className="w-4 h-4 mr-2" />
                Add Tax Record
              </Link>
            </Button>
          </div>

          {property.property_taxes?.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No tax records recorded</p>
                <Button asChild>
                  <Link href={`/properties/${params.id}/taxes/new`}>Add First Record</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {property.property_taxes?.map((tax: any) => (
                <Card key={tax.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">Tax Year {tax.tax_year}</h4>
                        {tax.tax_authority && (
                          <p className="text-sm text-gray-600">{tax.tax_authority}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          tax.payment_status === 'paid' ? 'default' :
                          tax.payment_status === 'overdue' ? 'destructive' :
                          'outline'
                        }>
                          {tax.payment_status}
                        </Badge>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/properties/${params.id}/taxes/${tax.id}/edit`}>
                            <Edit className="w-4 h-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Annual Amount:</span>
                        <span className="font-medium">${tax.annual_amount.toLocaleString()}</span>
                      </div>
                      {tax.assessor_parcel_number && (
                        <div className="flex justify-between mt-1">
                          <span className="text-gray-500">Parcel #:</span>
                          <span>{tax.assessor_parcel_number}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>Property Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {property.notes ? (
                <p className="whitespace-pre-wrap">{property.notes}</p>
              ) : (
                <p className="text-gray-600">No notes added for this property.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
