import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffSession } from '@/lib/auth'

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
}
function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
}
function startOfWeek(d: Date) {
  const day = d.getDay() // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day // Monday
  const monday = new Date(d)
  monday.setDate(d.getDate() + diff)
  return startOfDay(monday)
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0)
}

// ─── GET /api/admin/payments?range=today|week|month&page=1&limit=50
export async function GET(req: NextRequest) {
  try {
    const session = await requireStaffSession(req)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const range = searchParams.get('range') ?? 'today'
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '50', 10))

    const now = new Date()
    const rangeFilter: Record<string, { gte: Date; lte: Date }> = {
      today: { gte: startOfDay(now), lte: endOfDay(now) },
      week:  { gte: startOfWeek(now), lte: endOfDay(now) },
      month: { gte: startOfMonth(now), lte: endOfDay(now) },
    }

    const dateFilter = rangeFilter[range] ?? rangeFilter['today']

    const where = { paymentDate: dateFilter }

    const [payments, total, aggregate] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          member: { select: { memberId: true, fullName: true } },
          staff: { select: { name: true } },
        },
        orderBy: { paymentDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.payment.count({ where }),
      prisma.payment.aggregate({ where, _sum: { amount: true } }),
    ])

    const data = payments.map((p) => ({
      id: p.id,
      receiptNumber: p.receiptNumber,
      memberName: p.member?.fullName ?? p.walkInName ?? 'Guest visitor',
      memberId: p.member?.memberId ?? null,
      walkInName: p.walkInName ?? null,
      paymentType: p.paymentType,
      amount: Number(p.amount),
      paymentDate: p.paymentDate.toISOString(),
      staffName: p.staff.name,
    }))

    return NextResponse.json({
      data,
      total,
      page,
      limit,
      totalAmount: Number(aggregate._sum.amount ?? 0),
    })
  } catch (error) {
    console.error('[GET /api/admin/payments]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
