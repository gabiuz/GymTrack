import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken, verifyOwnerToken, ADMIN_SESSION_COOKIE, OWNER_SESSION_COOKIE } from '@/lib/auth'

// ─── GET /api/auth/admin-me ───────────────────────────────────────────────────
// Returns the name + role of the currently logged-in admin OR owner.
export async function GET(req: NextRequest) {
  // Try admin cookie first
  const adminToken = req.cookies.get(ADMIN_SESSION_COOKIE)?.value
  if (adminToken) {
    const payload = await verifyAdminToken(adminToken)
    if (payload) {
      return NextResponse.json({ name: payload.name, role: payload.role })
    }
  }

  // Try owner cookie
  const ownerToken = req.cookies.get(OWNER_SESSION_COOKIE)?.value
  if (ownerToken) {
    const payload = await verifyOwnerToken(ownerToken)
    if (payload) {
      return NextResponse.json({ name: payload.name, role: payload.role })
    }
  }

  return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
}
