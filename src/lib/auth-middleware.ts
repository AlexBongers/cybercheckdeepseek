import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE } from '@/lib/session'

export function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isPublic =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/api/logout' ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/api/signup') ||
    pathname.startsWith('/_next')

  const userId = request.cookies.get(SESSION_COOKIE)?.value

  if (!userId && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (userId && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}
