import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireOwnerSession } from '@/lib/auth'
import { Prisma } from '@/generated/prisma'

// ─── GET /api/owner/dashboard/overview ──────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await requireOwnerSession(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
    const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const since7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const [
      todayVisitors,
      todayRevenueAgg,
      activeMembers,
      activePlans,
      expiringIn7Days,
      newThisMonth,
      unassigned,
      expiredWithNoActivePlan,
      revenueChartRows,
    ] = await Promise.all([
      prisma.attendance.count({ where: { checkInTime: { gte: startOfToday } } }),
      prisma.payment.aggregate({ where: { paymentDate: { gte: startOfToday } }, _sum: { amount: true } }),
      // Members with at least one Membership with endDate >= now
      prisma.membership.groupBy({ by: ['memberId'], where: { endDate: { gte: now } } }).then((r) => r.length),
      prisma.monthlyPlan.count({ where: { endDate: { gte: now } } }),
      prisma.monthlyPlan.count({ where: { endDate: { gte: now, lte: in7Days } } }),
      prisma.member.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.member.count({ where: { memberships: { none: {} } } }),
      // Expired: had a membership, most recent one is expired, and no active plan
      prisma.member.count({
        where: {
          memberships: { some: { endDate: { lt: now } } },
          monthlyPlans: { none: { endDate: { gte: now } } },
        },
      }),
      prisma.$queryRaw<{ date: string; amount: number }[]>(
        Prisma.sql`
          SELECT DATE("paymentDate") as date, SUM(amount)::float as amount
          FROM "Payment"
          WHERE "paymentDate" >= ${since7Days}
          GROUP BY DATE("paymentDate")
          ORDER BY date ASC
        `
      ),
    ])

    return NextResponse.json({
      todayVisitors,
      todayRevenue: Number(todayRevenueAgg._sum.amount ?? 0),
      activeMembers,
      activePlans,
      expiringIn7Days,
      newThisMonth,
      needsAttention: {
        expiringSoon: expiringIn7Days,
        expired:      expiredWithNoActivePlan,
        unassigned,
      },
      revenueChart: revenueChartRows.map((r) => ({ date: String(r.date), amount: Number(r.amount) })),
    })
  } catch (error) {
    console.error('[GET /api/owner/dashboard/overview]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
