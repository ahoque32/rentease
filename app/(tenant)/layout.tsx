import PortalNav from '@/components/tenant/PortalNav'
import { createClient } from '@/lib/supabase/server'

export default async function TenantPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let tenantName: string | undefined

  if (user) {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('first_name, last_name')
      .eq('auth_user_id', user.id)
      .single()

    if (tenant) {
      tenantName = [tenant.first_name, tenant.last_name].filter(Boolean).join(' ')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalNav tenantName={tenantName} />
      <main className="mx-auto max-w-5xl p-4 pb-24 md:pb-6">{children}</main>
    </div>
  )
}
