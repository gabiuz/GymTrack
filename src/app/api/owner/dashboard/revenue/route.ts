import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireOwnerSession } from '@/lib/auth'
import { Prisma } from '@/generated/prisma'

// ─── GET /api/owner/dashboard/revenue?range=week|month|year ─────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await requireOwnerSession(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const range = searchParams.get('range') ?? 'month'

    const now = new Date()
    const subDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() - n); return x }
    const subMonths = (d: Date, n: number) => { const x = new Date(d); x.setMonth(x.getMonth() - n); return x }

    const rangeStart: Record<string, Date> = {
      week:  subDays(now, 7),
      month: subDays(now, 30),
      year:  subMonths(now, 6),
    }

    const since = rangeStart[range] ?? rangeStart['month']
    const days  = range === 'week' ? 7 : range === 'month' ? 30 : 182

    const [aggregate, byTypeRows, chartRows] = await Promise.all([
      prisma.payment.aggregate({ where: { paymentDate: { gte: since } }, _sum: { amount: true }, _count: true }),
      prisma.payment.groupBy({
        by: ['paymentType'],
        where: { paymentDate: { gte: since } },
        _sum: { amount: true },
      }),
      prisma.$queryRaw<{ label: string; amount: number }[]>(
        Prisma.sql`
          SELECT TO_CHAR("paymentDate", 'Mon') as label,
                 SUM(amount)::float as amount
          FROM "Payment"
          WHERE "paymentDate" >= ${subMonths(now, 6)}
          GROUP BY TO_CHAR("paymentDate", 'Mon'), DATE_TRUNC('month', "paymentDate")
          ORDER BY DATE_TRUNC('month', "paymentDate") ASC
        `
      ),
    ])

    const totalRevenue = Number(aggregate._sum.amount ?? 0)
    const totalTransactions = aggregate._count

    const getByType = (type: string) => {
      const row = byTypeRows.find((r) => r.paymentType === type)
      return Number(row?._sum.amount ?? 0)
    }

    return NextResponse.json({
      totalRevenue,
      avgPerDay: days > 0 ? Math.round(totalRevenue / days) : 0,
      totalTransactions,
      byType: {
        monthlyPlans:   getByType('monthly_plan'),
        dailyVisits:    getByType('daily_visit'),
        membershipFees: getByType('membership_fee'),
      },
      chart: chartRows.map((r) => ({ label: String(r.label), amount: Number(r.amount) })),
    })
  } catch (error) {
    console.error('[GET /api/owner/dashboard/revenue]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
