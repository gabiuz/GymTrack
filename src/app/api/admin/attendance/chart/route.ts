import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffSession } from '@/lib/auth'
import { Prisma } from '@/generated/prisma'

// ─── GET /api/admin/attendance/chart?range=7d|30d
export async function GET(req: NextRequest) {
  try {
    const session = await requireStaffSession(req)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    let range = searchParams.get('range') ?? '7d'
    if (!['today', '3d', '7d', '30d'].includes(range)) {
      range = '7d'
    }

    const rangeDays: Record<string, number> = { today: 0, '3d': 3, '7d': 7, '30d': 30 }
    const daysBack = rangeDays[range]

    const since = new Date()
    since.setDate(since.getDate() - daysBack)
    since.setHours(0, 0, 0, 0)

    // Raw SQL for clean date grouping across timezones
    const rows = await prisma.$queryRaw<{ date: string; count: bigint }[]>(
      Prisma.sql`
        SELECT DATE("checkInTime") as date, COUNT(*) as count
        FROM "Attendance"
        WHERE "checkInTime" >= ${since}
        GROUP BY DATE("checkInTime")
        ORDER BY date ASC
      `
    )

    const data = rows.map((r) => ({
      date: String(r.date),
      count: Number(r.count),
    }))

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[GET /api/admin/attendance/chart]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
