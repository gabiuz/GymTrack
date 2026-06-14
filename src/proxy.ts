import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, SESSION_COOKIE } from '@/lib/auth'

// Routes that require a valid session cookie
const PROTECTED_PATHS = ['/my-pass', '/membership']

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isProtected = PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )

  if (!isProtected) return NextResponse.next()

  const token = req.cookies.get(SESSION_COOKIE)?.value

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const session = await verifyToken(token)
  if (!session) {
    // Token is invalid or expired — clear the bad cookie and redirect
    const res = NextResponse.redirect(new URL('/login', req.url))
    res.cookies.set(SESSION_COOKIE, '', { maxAge: 0, path: '/' })
    return res
  }

  return NextResponse.next()
}

export const config = {
  // Only run proxy on app routes, not static files or API routes
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
