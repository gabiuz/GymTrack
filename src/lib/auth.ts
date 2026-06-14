import { SignJWT, jwtVerify } from 'jose'

export const SESSION_COOKIE = 'gymtrack_session'
const EXPIRY = '7d'

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET environment variable is not set')
  return new TextEncoder().encode(secret)
}

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
