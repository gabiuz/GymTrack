import { NextRequest, NextResponse } from 'next/server'
import {
  verifyToken,
  SESSION_COOKIE,
  ADMIN_SESSION_COOKIE,
  OWNER_SESSION_COOKIE,
  verifyAdminToken,
  verifyOwnerToken,
} from '@/lib/auth'

// Customer-facing routes that require a valid session cookie
const PROTECTED_PATHS = ['/my-pass', '/membership']

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ── Owner route guard ─────────────────────────────────────────────────────
  if (pathname.startsWith('/owner') && !pathname.startsWith('/owner/login')) {
    const token = req.cookies.get(OWNER_SESSION_COOKIE)?.value
    if (!token) {
      return NextResponse.redirect(new URL('/owner/login', req.url))
    }

    const payload = await verifyOwnerToken(token).catch(() => null)
    if (!payload || payload.role !== 'owner') {
      const res = NextResponse.redirect(new URL('/owner/login', req.url))
      res.cookies.set(OWNER_SESSION_COOKIE, '', { maxAge: 0, path: '/' })
      return res
    }

    return NextResponse.next()
  }

  // ── Admin route guard ─────────────────────────────────────────────────────
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }

    const payload = await verifyAdminToken(token)
    if (!payload || !['staff', 'owner'].includes(payload.role)) {
      const res = NextResponse.redirect(new URL('/admin/login', req.url))
      res.cookies.set(ADMIN_SESSION_COOKIE, '', { maxAge: 0, path: '/' })
      return res
    }

    return NextResponse.next()
  }

  // ── Customer route guard ──────────────────────────────────────────────────
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
