import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireOwnerSession } from '@/lib/auth'

// ─── GET /api/owner/attendance?range=today|3d|7d|30d&page=1&limit=50
export async function GET(req: NextRequest) {
  try {
    const session = await requireOwnerSession(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
<<<<<<< HEAD
    const range = searchParams.get('range') ?? 'today'
=======
    let range = searchParams.get('range') ?? 'today'
    if (!['today', '3d', '7d', '30d'].includes(range)) {
      range = 'today'
    }
>>>>>>> origin/dev
    const page  = Math.max(1, parseInt(searchParams.get('page')  ?? '1',  10))
    const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '50', 10))

    const rangeDays: Record<string, number> = { today: 0, '3d': 3, '7d': 7, '30d': 30 }
<<<<<<< HEAD
    const daysBack = rangeDays[range] ?? 0
=======
    const daysBack = rangeDays[range]
>>>>>>> origin/dev

    const since = new Date()
    since.setDate(since.getDate() - daysBack)
    since.setHours(0, 0, 0, 0)

    const where = { checkInTime: { gte: since } }

    const [attendance, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        include: {
          member: { select: { memberId: true, fullName: true } },
          staff:  { select: { name: true } },
        },
        orderBy: { checkInTime: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.attendance.count({ where }),
    ])

    const data = attendance.map((a) => ({
      id:          a.id,
      memberName:  a.member?.fullName ?? a.walkInName ?? 'Walk-in',
      memberId:    a.member?.memberId ?? null,
      checkInTime: a.checkInTime.toISOString(),
      visitType:   a.visitType,
      staffName:   a.staff.name,
    }))

    return NextResponse.json({ data, total, page, limit })
  } catch (error) {
    console.error('[GET /api/owner/attendance]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
