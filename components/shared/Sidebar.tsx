'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  DollarSign,
  Wrench,
  Shield,
  Settings,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Properties', href: '/properties', icon: Building2 },
  { name: 'Tenants', href: '/tenants', icon: Users },
  { name: 'Leases', href: '/leases', icon: FileText },
  { name: 'Payments', href: '/payments', icon: DollarSign },
  { name: 'Maintenance', href: '/maintenance', icon: Wrench },
  { name: 'Insurance', href: '/insurance', icon: Shield },
  { name: 'Settings', href: '/settings', icon: Settings },
]

interface SidebarProps {
  newMaintenanceCount?: number
}

export function Sidebar({ newMaintenanceCount = 0 }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <span className="text-lg font-bold text-white">R</span>
          </div>
          <span className="text-xl font-bold text-gray-900">RentEase</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
        {navigation.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const showMaintenanceIndicator = item.href === '/maintenance' && newMaintenanceCount > 0

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <item.icon className={cn('h-5 w-5', isActive ? 'text-blue-600' : 'text-gray-500')} />
              <span>{item.name}</span>
              {showMaintenanceIndicator && (
                <span className="ml-auto inline-flex items-center gap-1 text-xs text-red-600">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  {newMaintenanceCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-gray-200 p-4">
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
          >
            Sign Out
          </button>
        </form>
      </div>
    </div>
  )
}
