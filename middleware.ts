import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { updateSession } from './src/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/goals') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/today')

  const isAuthRoute =
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/forgot' ||
    pathname === '/reset' ||
    pathname.startsWith('/auth/')

  if (isProtectedRoute || isAuthRoute) {
    return updateSession(request)
  }

  const response = NextResponse.next()
  if (!request.cookies.has('NEXT_LOCALE')) {
    const acceptLanguage = request.headers.get('accept-language') || ''
    const locale = acceptLanguage.includes('zh') ? 'zh' : 'en'
    response.cookies.set('NEXT_LOCALE', locale)
  }
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons/.*|manifest.json).*)'],
}
