import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/shared/Sidebar'
import { MobileNav } from '@/components/shared/MobileNav'
import { AIChat } from '@/components/dashboard/AIChat'

export default async function LandlordLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Auth bypass — demo mode
  // const supabase = createClient()
  // const { data: { user } } = await supabase.auth.getUser()
  // if (!user) { // redirect('/login') // demo mode }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main Content */}
      <main className="md:pl-64 pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <MobileNav />
      </div>

      {/* AI Chat Widget */}
      <AIChat />
    </div>
  )
}
