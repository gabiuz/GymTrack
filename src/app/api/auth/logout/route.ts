import { NextResponse } from 'next/server'
import { SESSION_COOKIE } from '@/lib/auth'

// ─── POST /api/auth/logout
// Clears the session cookie and returns 200.
export async function POST() {
  const response = NextResponse.json({ message: 'Logged out successfully' })
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0, // expire immediately
  })
  return response
}
