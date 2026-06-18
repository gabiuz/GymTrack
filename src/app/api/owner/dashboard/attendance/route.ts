import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireOwnerSession } from '@/lib/auth'
import { Prisma } from '@/generated/prisma'

// Helper — extract the PHT (Asia/Manila) hour from a Date object,
// identical to what the Attendance page does via toLocaleTimeString("en-PH").
function phtHour(d: Date): number {
  return parseInt(
    new Intl.DateTimeFormat('en-PH', {
      timeZone: 'Asia/Manila',
      hour:     'numeric',
      hour12:   false,
    }).format(d),
    10
  )
}

function phtDow(d: Date): string {
  return new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    weekday:  'short',
  }).format(d) // 'Mon', 'Tue', …
}

function fmtHourLabel(h: number): string {
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12  = h % 12 || 12
  return `${h12}:00 ${ampm}`
}

// ─── GET /api/owner/dashboard/attendance?range=week|month ───────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await requireOwnerSession(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const range = searchParams.get('range') ?? 'month'

    const now = new Date()
    const days = range === 'week' ? 7 : 30
    const rangeStart = new Date(now)
    rangeStart.setDate(rangeStart.getDate() - days)
    rangeStart.setHours(0, 0, 0, 0)

    // Fetch raw attendance records so we can aggregate in JS using the same
    // timezone conversion the Attendance page uses (Intl / Asia/Manila).
    const [allRows, visitMixRaw, dailyMemberCount, dailyGuestCount] = await Promise.all([
      prisma.attendance.findMany({
        where: { checkInTime: { gte: rangeStart } },
        select: { checkInTime: true, visitType: true },
      }),
      prisma.attendance.groupBy({
        by: ['visitType'],
        where: { checkInTime: { gte: rangeStart } },
        _count: true,
      }),
      prisma.attendance.count({
        where: { checkInTime: { gte: rangeStart }, visitType: 'daily', memberId: { not: null } },
      }),
      prisma.attendance.count({
        where: { checkInTime: { gte: rangeStart }, visitType: 'daily', memberId: null },
      }),
    ])

    const totalCheckIns = allRows.length

    // ── Aggregate by PHT hour (0-23) ─────────────────────────────────────────
    const hourMap = new Map<number, number>()
    for (const row of allRows) {
      const h = phtHour(row.checkInTime)
      hourMap.set(h, (hourMap.get(h) ?? 0) + 1)
    }

    // Sort hours 0-23
    const byHourRows = Array.from(hourMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([hour, count]) => ({ hour, count }))

    // Peak hour — the hour with the most check-ins in PHT local time
    const peakHourEntry = byHourRows.length
      ? byHourRows.reduce((best, cur) => (cur.count > best.count ? cur : best))
      : null

    const peakHour = peakHourEntry
      ? `${fmtHourLabel(peakHourEntry.hour)} (${peakHourEntry.count} check-in${peakHourEntry.count !== 1 ? 's' : ''})`
      : 'N/A'

    // ── Aggregate by PHT day-of-week ─────────────────────────────────────────
    const dowOrder: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
    const dowMap = new Map<string, number>()
    for (const row of allRows) {
      const d = phtDow(row.checkInTime)
      dowMap.set(d, (dowMap.get(d) ?? 0) + 1)
    }
    const byDayRows = Array.from(dowMap.entries())
      .sort((a, b) => (dowOrder[a[0]] ?? 7) - (dowOrder[b[0]] ?? 7))
      .map(([day, count]) => ({ day, count }))

    // Busiest day
    const busiestDayEntry = byDayRows.length
      ? byDayRows.reduce((best, cur) => (cur.count > best.count ? cur : best))
      : null
    const dayNames: Record<string, string> = {
      Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday',
      Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday',
    }
    const busiestDay = busiestDayEntry
      ? (dayNames[busiestDayEntry.day] ?? busiestDayEntry.day)
      : 'N/A'

    // ── Visit mix ─────────────────────────────────────────────────────────────
    const monthlyPlanCount = visitMixRaw.find((v) => v.visitType === 'monthly_plan')?._count ?? 0
    const total = totalCheckIns || 1
    const pct = (n: number) => Math.round((n / total) * 100)

    return NextResponse.json({
      totalCheckIns,
      avgPerDay:   Math.round(totalCheckIns / days),
      busiestDay,
      peakHour,
      byDayOfWeek: byDayRows.map((r) => ({ day: r.day, count: r.count })),
      byHour:      byHourRows.map((r) => ({ hour: fmtHourLabel(r.hour), count: r.count })),
      visitMix: {
        monthlyPlan: pct(monthlyPlanCount),
        dailyMember: pct(dailyMemberCount),
        dailyGuest:  pct(dailyGuestCount),
      },
    })
  } catch (error) {
    console.error('[GET /api/owner/dashboard/attendance]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
