import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffSession } from '@/lib/auth'

// ─── POST /api/admin/checkin
export async function POST(req: NextRequest) {
  try {
    const session = await requireStaffSession(req)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { memberId } = body as { memberId?: string }

    // ── SCENARIO B-GUEST: no memberId supplied
    if (!memberId) {
      return NextResponse.json({
        status: 'guest',
        rate: 75,
      })
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

    // ── Duplicate check: has this member already checked in today?
    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(now)
    todayEnd.setHours(23, 59, 59, 999)

    const existingToday = await prisma.attendance.findFirst({
      where: {
        memberId: member.id,
        checkInTime: { gte: todayStart, lte: todayEnd },
      },
    })

    if (existingToday) {
      return NextResponse.json({
        status: 'already_checked_in',
        member: { id: member.id, memberId: member.memberId, fullName: member.fullName, photoUrl: member.photoUrl },
        checkedInAt: existingToday.checkInTime.toISOString(),
      })
    }

    // ── Step 2: Check for active MonthlyPlan
    const activePlan = await prisma.monthlyPlan.findFirst({
      where: {
        memberId: member.id,
        endDate: { gte: now },
      },
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
        member: {
          id: member.id,
          memberId: member.memberId,
          fullName: member.fullName,
          photoUrl: member.photoUrl,
        },
        planEndDate: activePlan.endDate.toISOString(),
      })
    }

    // ── Step 3: Check for active annual Membership
    const activeMembership = await prisma.membership.findFirst({
      where: {
        memberId: member.id,
        endDate: { gte: now },
      },
      orderBy: { endDate: 'desc' },
    })

    if (activeMembership) {
      // SCENARIO B-MEMBER: daily visit at member rate
      return NextResponse.json({
        status: 'member_daily',
        member: {
          id: member.id,
          memberId: member.memberId,
          fullName: member.fullName,
          photoUrl: member.photoUrl,
        },
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
      // SCENARIO D — expired membership
      return NextResponse.json({
        status: 'expired',
        member: {
          id: member.id,
          memberId: member.memberId,
          fullName: member.fullName,
          photoUrl: member.photoUrl,
        },
        membershipEndDate: anyMembership.endDate.toISOString(),
      })
    }

    // ── Step 4: No membership at all — SCENARIO A (unassigned)
    return NextResponse.json({
      status: 'unassigned',
      member: {
        id: member.id,
        memberId: member.memberId,
        fullName: member.fullName,
        photoUrl: member.photoUrl,
      },
    })
  } catch (error) {
    console.error('[POST /api/admin/checkin]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
