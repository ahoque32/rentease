import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function TenantPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">R</span>
            </div>
            <span className="font-semibold text-gray-900">Tenant Portal</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4">
        {children}
      </main>
    </div>
  )
}
