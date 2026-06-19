import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireOwnerSession } from '@/lib/auth'
import { Prisma } from '@/generated/prisma'

// ─── GET /api/owner/dashboard/memberships ───────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await requireOwnerSession(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const now = new Date()
    const subDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() - n); return x }
    const subMonths = (d: Date, n: number) => { const x = new Date(d); x.setMonth(x.getMonth() - n); return x }
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    const thirtyDaysAgo = subDays(now, 30)
    const sixMonthsAgo = subMonths(now, 6)

    const [
      activeMembers,
      newThisMonth,
      expiredLast30Days,
      expiringThisMonth,
      renewalPayments,
      memberGrowthRows,
      activePlansByDuration,
      dailyVisitOnly,
    ] = await Promise.all([
      prisma.membership.groupBy({ by: ['memberId'], where: { endDate: { gte: now } } }).then((r) => r.length),
      prisma.member.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.membership.count({ where: { endDate: { gte: thirtyDaysAgo, lt: now } } }),
      prisma.membership.count({ where: { endDate: { gte: now, lte: endOfMonth } } }),
      prisma.payment.count({ where: { paymentType: 'membership_fee', paymentDate: { gte: thirtyDaysAgo } } }),
      prisma.$queryRaw<{ month: string; count: number }[]>(
        Prisma.sql`
          SELECT TO_CHAR("createdAt", 'Mon') as month,
                 COUNT(*)::int as count
          FROM "Member"
          WHERE "createdAt" >= ${sixMonthsAgo}
          GROUP BY TO_CHAR("createdAt", 'Mon'), DATE_TRUNC('month', "createdAt")
          ORDER BY DATE_TRUNC('month', "createdAt") ASC
        `
      ),
      prisma.monthlyPlan.groupBy({ by: ['duration'], where: { endDate: { gte: now } }, _count: true }),
      prisma.member.count({
        where: {
          memberships:  { some: { endDate: { gte: now } } },
          monthlyPlans: { none: { endDate: { gte: now } } },
        },
      }),
    ])

    const renewalRate =
      expiredLast30Days > 0
        ? Math.round((renewalPayments / (renewalPayments + expiredLast30Days)) * 100)
        : 100

    const getPlanCount = (dur: number) => activePlansByDuration.find((p) => p.duration === dur)?._count ?? 0

    return NextResponse.json({
      activeMembers,
      newThisMonth,
      expiredLast30Days,
      expiringThisMonth,
      renewalRate,
      memberGrowthChart: memberGrowthRows.map((r) => ({ month: String(r.month), count: Number(r.count) })),
      activePlansByType: {
        oneMonth:     getPlanCount(1),
        threeMonths:  getPlanCount(3),
        sixMonths:    getPlanCount(6),
        dailyVisitOnly,
      },
    })
  } catch (error) {
    console.error('[GET /api/owner/dashboard/memberships]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
