import { SignJWT, jwtVerify } from 'jose'
import { NextRequest } from 'next/server'

// ─── Customer session ───────────────────────────────────────────────────────
export const SESSION_COOKIE = 'gymtrack_session'

// ─── Admin session ──────────────────────────────────────────────────────────
export const ADMIN_SESSION_COOKIE = 'gymtrack_admin_session'

// ─── Owner session ───────────────────────────────────────────────────────────
export const OWNER_SESSION_COOKIE = 'gymtrack_owner_session'

const EXPIRY = '7d'

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET environment variable is not set')
  return new TextEncoder().encode(secret)
}

// ─── Customer session payload ────────────────────────────────────────────────
export interface SessionPayload {
  memberId: string
  fullName: string
  sub: string // = memberId, required by JWT spec
}

export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(getSecret())
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

/** Build the Set-Cookie options shared by login + registration responses */
export function sessionCookieOptions(token: string) {
  const isProduction = process.env.NODE_ENV === 'production'
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
  }
}

// ─── Admin session payload ───────────────────────────────────────────────────
export interface AdminSessionPayload {
  sub: string // userId as string
  userId: number
  name: string
  role: string // 'staff' | 'owner'
}

export async function signAdminToken(payload: AdminSessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(getSecret())
}

export async function verifyAdminToken(token: string): Promise<AdminSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as unknown as AdminSessionPayload
  } catch {
    return null
  }
}

export function adminCookieOptions(token: string) {
  const isProduction = process.env.NODE_ENV === 'production'
  return {
    name: ADMIN_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  }
}

/**
 * Verify the gymtrack_admin_session cookie.
 * Returns the decoded payload on success, or null if missing/invalid.
 * Usage: const session = await requireStaffSession(req)
 *        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
 */
export async function requireStaffSession(req: NextRequest): Promise<AdminSessionPayload | null> {
  const token = req.cookies.get(ADMIN_SESSION_COOKIE)?.value
  if (!token) return null
  return verifyAdminToken(token)
}

// ─── Owner session helpers ────────────────────────────────────────────────────
// Owner uses the same JWT shape as admin — just a different cookie name.

export async function signOwnerToken(payload: AdminSessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(getSecret())
}

export async function verifyOwnerToken(token: string): Promise<AdminSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as unknown as AdminSessionPayload
  } catch {
    return null
  }
}

export function ownerCookieOptions(token: string) {
  const isProduction = process.env.NODE_ENV === 'production'
  return {
    name: OWNER_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  }
}

/**
 * Verify the gymtrack_owner_session cookie.
 * Returns the decoded payload on success, or null if missing/invalid/not owner role.
 */
export async function requireOwnerSession(req: NextRequest): Promise<AdminSessionPayload | null> {
  const token = req.cookies.get(OWNER_SESSION_COOKIE)?.value
  if (!token) return null
  const payload = await verifyOwnerToken(token)
  if (!payload || payload.role !== 'owner') return null
  return payload
}
