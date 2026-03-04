import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/shared/Sidebar'
import { MobileNav } from '@/components/shared/MobileNav'
import { AIChat } from '@/components/dashboard/AIChat'
import { getUserRole } from '@/lib/auth/utils'

export default async function LandlordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const role = await getUserRole(supabase)

  if (!user) {
    redirect('/login')
  }

  if (role !== 'owner') {
    redirect('/portal')
  }

  const { data: landlord } = await supabase
    .from('landlords')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!landlord) {
    const admin = createAdminClient()
    await admin.from('landlords').insert({
      id: user.id,
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Landlord',
      email: user.email!,
    })
  }

  const { count: newMaintenanceCount } = await supabase
    .from('maintenance_requests')
    .select('id', { count: 'exact', head: true })
    .eq('landlord_id', user.id)
    .eq('status', 'new')

  return (
    <div className="min-h-screen">
      <div className="hidden md:block">
        <Sidebar newMaintenanceCount={newMaintenanceCount || 0} />
      </div>

      <main className="pb-20 md:pb-0 md:pl-64">
        <div className="sticky top-0 z-30 hidden border-b border-white/30 bg-white/80 px-8 py-3 backdrop-blur-md md:block">
          <p className="text-sm font-medium text-gray-700">Landlord Portal</p>
        </div>
        <div className="mx-auto max-w-7xl p-4 md:p-8">{children}</div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <MobileNav newMaintenanceCount={newMaintenanceCount || 0} />
      </div>

      <AIChat />
    </div>
  )
}
