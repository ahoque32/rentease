import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, Plus, MapPin, Home } from 'lucide-react'

export default async function PropertiesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: properties } = await supabase
    .from('properties')
    .select(`
      *,
      units(*)
    `)
    .eq('landlord_id', user!.id)
    .eq('archived', false)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
          <p className="text-gray-600">Manage your rental properties and units</p>
        </div>
        <Button asChild>
          <Link href="/properties/new">
            <Plus className="w-4 h-4 mr-2" />
            Add Property
          </Link>
        </Button>
      </div>

      {properties?.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No properties yet</h3>
            <p className="text-gray-600 mb-6">Add your first property to get started</p>
            <Button asChild>
              <Link href="/properties/new">Add Property</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {properties?.map((property) => {
            const occupiedUnits = property.units?.filter((u: { status: string }) => u.status === 'occupied').length || 0
            const totalUnits = property.units?.length || 0

            return (
              <Link key={property.id} href={`/properties/${property.id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Home className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{property.name}</h3>
                          <div className="flex items-center gap-1 text-gray-600 mt-1">
                            <MapPin className="w-4 h-4" />
                            <span className="text-sm">
                              {property.address_line1}, {property.city}, {property.state} {property.zip}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-3">
                            <Badge variant="secondary">
                              {totalUnits} {totalUnits === 1 ? 'Unit' : 'Units'}
                            </Badge>
                            <Badge variant={occupiedUnits === totalUnits ? 'default' : 'secondary'}>
                              {occupiedUnits} Occupied
                            </Badge>
                            <Badge variant="outline">
                              {property.type?.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
