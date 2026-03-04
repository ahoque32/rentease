'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Building2,
  Users,
  DollarSign,
  Wrench,
  Menu,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Properties', href: '/properties', icon: Building2 },
  { name: 'Tenants', href: '/tenants', icon: Users },
  { name: 'Payments', href: '/payments', icon: DollarSign },
  { name: 'Maintenance', href: '/maintenance', icon: Wrench },
]

interface MobileNavProps {
  newMaintenanceCount?: number
}

export function MobileNav({ newMaintenanceCount = 0 }: MobileNavProps) {
  const pathname = usePathname()

  return (
    <div className="safe-area-pb border-t border-white/30 bg-white/80 backdrop-blur-md">
      <nav className="flex items-center justify-around px-2 py-2">
        {navigation.slice(0, 4).map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex min-w-[64px] flex-col items-center gap-1 rounded-lg px-3 py-2',
                isActive ? 'bg-white/70 text-blue-700' : 'text-gray-600'
              )}
            >
              <item.icon className={cn('h-5 w-5', isActive ? 'text-blue-600' : 'text-gray-500')} />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          )
        })}

        <Sheet>
          <SheetTrigger asChild>
            <button className="relative flex min-w-[64px] flex-col items-center gap-1 rounded-lg px-3 py-2 text-gray-600">
              <Menu className="h-5 w-5" />
              <span className="text-xs font-medium">More</span>
              {newMaintenanceCount > 0 && <span className="absolute right-3 top-2 h-2 w-2 rounded-full bg-red-500" />}
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto border-white/30 bg-white/90 backdrop-blur-xl">
            <div className="grid grid-cols-3 gap-4 p-4">
              {navigation.map((item) => {
                const isActive = pathname.startsWith(item.href)
                const showMaintenanceIndicator = item.href === '/maintenance' && newMaintenanceCount > 0

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'relative flex flex-col items-center gap-2 rounded-xl p-4 transition-colors',
                      isActive
                        ? 'bg-blue-100/80 text-blue-700'
                        : 'bg-white/70 text-gray-700 hover:bg-white/90'
                    )}
                  >
                    <item.icon className="h-6 w-6" />
                    <span className="text-sm font-medium">{item.name}</span>
                    {showMaintenanceIndicator && <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-red-500" />}
                  </Link>
                )
              })}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  )
}
