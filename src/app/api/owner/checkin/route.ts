import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireOwnerSession } from '@/lib/auth'

// ─── POST /api/owner/checkin ─────────────────────────────────────────────────
// Identical logic to /api/admin/checkin — uses owner session cookie.
export async function POST(req: NextRequest) {
  try {
    const session = await requireOwnerSession(req)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { memberId } = body as { memberId?: string }

    // ── SCENARIO B-GUEST: no memberId supplied
    if (!memberId) {
      return NextResponse.json({ status: 'guest', rate: 75 })
    }

    // ── Step 1: Find member
    const member = await prisma.member.findUnique({
      where: { memberId },
      select: { id: true, memberId: true, fullName: true, photoUrl: true },
    })

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    const now = new Date()

    // ── Step 2: Check for active MonthlyPlan
    const activePlan = await prisma.monthlyPlan.findFirst({
      where: { memberId: member.id, endDate: { gte: now } },
      orderBy: { endDate: 'desc' },
    })

    if (activePlan) {
      // SCENARIO C — auto-record attendance
      await prisma.attendance.create({
        data: {
          memberId: member.id,
          staffId: session.userId,
          visitType: 'monthly_plan',
          checkInTime: now,
        },
      })
      return NextResponse.json({
        status: 'monthly_active',
        member: { id: member.id, memberId: member.memberId, fullName: member.fullName, photoUrl: member.photoUrl },
        planEndDate: activePlan.endDate.toISOString(),
      })
    }

    // ── Step 3: Check for active annual Membership
    const activeMembership = await prisma.membership.findFirst({
      where: { memberId: member.id, endDate: { gte: now } },
      orderBy: { endDate: 'desc' },
    })

    if (activeMembership) {
      return NextResponse.json({
        status: 'member_daily',
        member: { id: member.id, memberId: member.memberId, fullName: member.fullName, photoUrl: member.photoUrl },
        rate: 70,
        membershipEndDate: activeMembership.endDate.toISOString(),
      })
    }

    // Check if there was ever a membership (expired)
    const anyMembership = await prisma.membership.findFirst({
      where: { memberId: member.id },
      orderBy: { endDate: 'desc' },
    })

    if (anyMembership) {
      return NextResponse.json({
        status: 'expired',
        member: { id: member.id, memberId: member.memberId, fullName: member.fullName, photoUrl: member.photoUrl },
        membershipEndDate: anyMembership.endDate.toISOString(),
      })
    }

    // ── Step 4: No membership — SCENARIO A (unassigned)
    return NextResponse.json({
      status: 'unassigned',
      member: { id: member.id, memberId: member.memberId, fullName: member.fullName, photoUrl: member.photoUrl },
    })
  } catch (error) {
    console.error('[POST /api/owner/checkin]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
