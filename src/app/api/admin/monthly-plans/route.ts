import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffSession } from '@/lib/auth'
import { z } from 'zod'

const MonthlyPlanSchema = z.object({
  memberId: z.number().int().positive(), // Member.id (numeric)
  duration: z.union([z.literal(1), z.literal(3), z.literal(6), z.literal(12)]),
  amount: z.number().positive(),
})

// ─── POST /api/admin/monthly-plans
export async function POST(req: NextRequest) {
  try {
    const session = await requireStaffSession(req)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = MonthlyPlanSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { memberId, duration, amount } = parsed.data

    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        monthlyPlans: { orderBy: { endDate: 'desc' }, take: 1, select: { endDate: true } },
        memberships: { orderBy: { endDate: 'desc' }, take: 1, select: { endDate: true } },
      },
    })
    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    const now = new Date()
    const latestMembership = member.memberships[0]
    if (!latestMembership || latestMembership.endDate < now) {
      return NextResponse.json(
        { error: 'Cannot avail monthly plan without an active annual membership' },
        { status: 403 }
      )
    }

    const latestPlan = member.monthlyPlans[0]
    const startDate = latestPlan && latestPlan.endDate > now ? new Date(latestPlan.endDate) : new Date()

    const endDate = new Date(startDate)
    endDate.setMonth(endDate.getMonth() + duration)

    const result = await prisma.$transaction(async (tx) => {
      const plan = await tx.monthlyPlan.create({
        data: { memberId, duration, amount, startDate, endDate },
      })

      const payment = await tx.payment.create({
        data: {
          memberId,
          staffId: session.userId,
          paymentType: 'monthly_plan',
          amount,
        },
      })

      return { plan, payment }
    })

    return NextResponse.json({ data: result }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/admin/monthly-plans]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
