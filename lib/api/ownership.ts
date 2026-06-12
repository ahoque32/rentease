import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Ownership checks shared by API routes that accept client-supplied resource IDs.
 * All queries run on the caller's user-scoped client, so RLS applies too.
 */

export async function userOwnsUnit(
  supabase: SupabaseClient,
  unitId: string,
  userId: string
): Promise<boolean> {
  const { data: unit } = await supabase
    .from('units')
    .select('id, properties!inner(landlord_id)')
    .eq('id', unitId)
    .single()

  return (unit as any)?.properties?.landlord_id === userId
}

export async function userOwnsProperty(
  supabase: SupabaseClient,
  propertyId: string,
  userId: string
): Promise<boolean> {
  const { data: property } = await supabase
    .from('properties')
    .select('id, landlord_id')
    .eq('id', propertyId)
    .single()

  return property?.landlord_id === userId
}

export async function userOwnsTenant(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string
): Promise<boolean> {
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, landlord_id')
    .eq('id', tenantId)
    .single()

  return tenant?.landlord_id === userId
}
