import type { SupabaseClient } from '@supabase/supabase-js'

export type UserRole = 'owner' | 'tenant'

export async function getUserRole(supabase: SupabaseClient): Promise<UserRole | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  return user.user_metadata?.role === 'tenant' ? 'tenant' : 'owner'
}
