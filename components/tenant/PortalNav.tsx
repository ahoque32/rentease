'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import {
  CreditCard,
  FileText,
  Home,
  Menu,
  Wallet,
  Wrench,
} from 'lucide-react'

interface PortalNavProps {
  tenantName?: string
}

const navItems = [
  { name: 'Dashboard', href: '/portal', icon: Home },
  { name: 'Pay Rent', href: '/portal/pay', icon: Wallet },
  { name: 'Payments', href: '/portal/payments', icon: CreditCard },
  { name: 'Maintenance', href: '/portal/maintenance', icon: Wrench },
  { name: 'My Lease', href: '/portal/lease', icon: FileText },
]

function isActive(pathname: string, href: string) {
  if (href === '/portal') return pathname === '/portal'
  return pathname.startsWith(href)
}

export default function PortalNav({ tenantName }: PortalNavProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const withToken = (href: string) => {
    if (!token) return href
    return `${href}?token=${encodeURIComponent(token)}`
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link href={withToken('/portal')} className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <span className="font-bold text-white">R</span>
              </div>
              <span className="font-semibold text-gray-900">Tenant Portal</span>
            </Link>
            <span className="hidden text-sm text-gray-500 sm:inline">{tenantName || 'Tenant'}</span>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href)
              return (
                <Link
                  key={item.name}
                  href={withToken(item.href)}
                  className={cn(
                    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  )}
                >
                  {item.name}
                </Link>
              )
            })}

            <form action="/auth/signout" method="post">
              <Button size="sm" variant="outline" type="submit">
                Sign out
              </Button>
            </form>
          </div>

          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button size="icon" variant="ghost" aria-label="Open tenant navigation">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <SheetHeader>
                  <SheetTitle>Tenant Portal</SheetTitle>
                </SheetHeader>

                <div className="mt-6 space-y-2">
                  <p className="text-sm text-gray-500">{tenantName || 'Tenant'}</p>
                  {navItems.map((item) => {
                    const active = isActive(pathname, item.href)
                    return (
                      <Link
                        key={item.name}
                        href={withToken(item.href)}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
                          active
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.name}
                      </Link>
                    )
                  })}
                </div>

                <div className="mt-8 border-t border-gray-200 pt-4">
                  <form action="/auth/signout" method="post">
                    <Button className="w-full" variant="outline" type="submit">
                      Sign out
                    </Button>
                  </form>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white px-2 py-2 md:hidden">
        <div className="mx-auto grid max-w-5xl grid-cols-5 gap-1">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href)
            return (
              <Link
                key={item.name}
                href={withToken(item.href)}
                className={cn(
                  'flex flex-col items-center rounded-md py-2 text-xs',
                  active ? 'text-blue-600' : 'text-gray-500'
                )}
              >
                <item.icon className="mb-1 h-4 w-4" />
                {item.name}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
