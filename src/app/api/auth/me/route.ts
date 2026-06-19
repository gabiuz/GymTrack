import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, SESSION_COOKIE } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// ─── GET /api/auth/me
// Returns the current logged-in member's profile from the session cookie.
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE)?.value

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const session = await verifyToken(token)
    if (!session) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 })
    }

    const now = new Date()

    const member = await prisma.member.findUnique({
      where: { memberId: session.memberId },
      select: {
        memberId: true,
        fullName: true,
        contactNumber: true,
        gender: true,
        photoUrl: true,
        qrCode: true,
        createdAt: true,
        memberships: {
          orderBy: { endDate: 'desc' },
          take: 1,
        },
        monthlyPlans: {
          orderBy: { endDate: 'desc' },
          take: 1,
        },
      },
    })

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    const latestMembership = member.memberships[0] ?? null
    const latestPlan = member.monthlyPlans[0] ?? null
    const hasActiveMembership = latestMembership ? latestMembership.endDate >= now : false
    const hasActivePlan = latestPlan ? latestPlan.endDate >= now : false

    const membershipStatus = hasActivePlan || hasActiveMembership
      ? 'active'
      : latestMembership || latestPlan
        ? 'expired'
        : 'unassigned'

    const memberData = {
      memberId: member.memberId,
      fullName: member.fullName,
      contactNumber: member.contactNumber,
      gender: member.gender,
      photoUrl: member.photoUrl,
      qrCode: member.qrCode,
      createdAt: member.createdAt,
      membershipStatus,
      annualStartDate: latestMembership?.startDate ?? null,
      annualEndDate: latestMembership?.endDate ?? null,
      monthlyStartDate: latestPlan?.startDate ?? null,
      monthlyEndDate: latestPlan?.endDate ?? null,
    }

    return NextResponse.json({ data: memberData })
  } catch (error) {
    console.error('[GET /api/auth/me]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
