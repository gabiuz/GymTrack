import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffSession } from '@/lib/auth'

// ─── GET /api/admin/memberships?type=annual|monthly&page=1&limit=20&search=
export async function GET(req: NextRequest) {
  try {
    const session = await requireStaffSession(req)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') ?? 'annual'
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '20', 10))
    const search = searchParams.get('search') ?? ''
    const now = new Date()

    if (type === 'annual') {
      const where = search
        ? {
            member: {
              OR: [
                { fullName: { contains: search, mode: 'insensitive' as const } },
                { memberId: { contains: search, mode: 'insensitive' as const } },
              ],
            },
          }
        : {}

      const [memberships, total] = await Promise.all([
        prisma.membership.findMany({
          where,
          include: { member: { select: { memberId: true, fullName: true } } },
          orderBy: { endDate: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.membership.count({ where }),
      ])

      const data = memberships.map((m) => ({
        id: m.id,
        memberDbId: m.memberId,
        memberId: m.member.memberId,
        memberName: m.member.fullName,
        startDate: m.startDate.toISOString(),
        endDate: m.endDate.toISOString(),
        isActive: m.endDate >= now,
      }))

      return NextResponse.json({ data, total, page, limit })
    }

    // Monthly plans
    const where = search
      ? {
          member: {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' as const } },
              { memberId: { contains: search, mode: 'insensitive' as const } },
            ],
          },
        }
      : {}

    const [plans, total] = await Promise.all([
      prisma.monthlyPlan.findMany({
        where,
        include: { member: { select: { memberId: true, fullName: true } } },
        orderBy: { endDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.monthlyPlan.count({ where }),
    ])

    const data = plans.map((p) => ({
      id: p.id,
      memberDbId: p.memberId,
      memberId: p.member.memberId,
      memberName: p.member.fullName,
      duration: p.duration,
      amount: Number(p.amount),
      startDate: p.startDate.toISOString(),
      endDate: p.endDate.toISOString(),
      isActive: p.endDate >= now,
    }))

    return NextResponse.json({ data, total, page, limit })
  } catch (error) {
    console.error('[GET /api/admin/memberships]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
