import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { getUserRole } from '@/lib/auth/utils'

export async function middleware(request: NextRequest) {
  const response = await updateSession(request)
  const pathname = request.nextUrl.pathname
  const token = request.nextUrl.searchParams.get('token')

  if (pathname.startsWith('/api/') || pathname.startsWith('/auth/')) {
    return response
  }

  const ownerRoutePrefixes = [
    '/dashboard',
    '/properties',
    '/tenants',
    '/leases',
    '/payments',
    '/maintenance',
    '/insurance',
    '/settings',
  ]
  const isOwnerRoute = ownerRoutePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  const isPortalRoute = pathname === '/portal' || pathname.startsWith('/portal/')

  if (!isOwnerRoute && !isPortalRoute) {
    return response
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const role = await getUserRole(supabase)

  if (!role) {
    if (isPortalRoute && token) {
      return response
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isOwnerRoute && role !== 'owner') {
    return NextResponse.redirect(new URL('/portal', request.url))
  }

  if (isPortalRoute && role !== 'tenant') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
