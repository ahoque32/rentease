'use client'

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Property {
  id: string
  name: string
}

interface Unit {
  id: string
  name: string
  property_id: string
  status: string
}

interface PropertyUnitSelectorProps {
  properties: Property[]
  units: Unit[]
}

export function PropertyUnitSelector({ properties, units }: PropertyUnitSelectorProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('')
  const [filteredUnits, setFilteredUnits] = useState<Unit[]>([])

  useEffect(() => {
    if (selectedPropertyId) {
      const unitsForProperty = units.filter(
        (unit) => unit.property_id === selectedPropertyId && unit.status === 'available'
      )
      setFilteredUnits(unitsForProperty)
    } else {
      setFilteredUnits([])
    }
  }, [selectedPropertyId, units])

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="property_id">Property</Label>
        <Select
          name="property_id"
          value={selectedPropertyId}
          onValueChange={setSelectedPropertyId}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a property (optional)" />
          </SelectTrigger>
          <SelectContent>
            {properties.map((property) => (
              <SelectItem key={property.id} value={property.id}>
                {property.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedPropertyId && (
        <div className="space-y-2">
          <Label htmlFor="unit_id">Unit</Label>
          <Select name="unit_id">
            <SelectTrigger>
              <SelectValue placeholder="Select a unit" />
            </SelectTrigger>
            <SelectContent>
              {filteredUnits.length === 0 ? (
                <SelectItem value="" disabled>
                  No available units for this property
                </SelectItem>
              ) : (
                filteredUnits.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {filteredUnits.length === 0 && (
            <p className="text-sm text-amber-600">
              No available units. Please select a different property or add a unit first.
            </p>
          )}
        </div>
      )}

      {selectedPropertyId && filteredUnits.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="monthly_rent">Monthly Rent ($)</Label>
            <input
              id="monthly_rent"
              name="monthly_rent"
              type="number"
              min="0"
              step="0.01"
              placeholder="1500.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="security_deposit">Security Deposit ($)</Label>
            <input
              id="security_deposit"
              name="security_deposit"
              type="number"
              min="0"
              step="0.01"
              placeholder="1500.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      )}
    </div>
  )
}
