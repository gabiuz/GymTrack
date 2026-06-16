import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffSession } from '@/lib/auth'
import { z } from 'zod'

const ConfirmSchema = z.object({
  memberId: z.string().optional().nullable(),
  walkInName: z.string().optional().nullable(),
  visitType: z.enum(['daily', 'monthly_plan']),
  amount: z.number().positive(),
})

// ─── POST /api/admin/checkin/confirm
export async function POST(req: NextRequest) {
  try {
    const session = await requireStaffSession(req)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = ConfirmSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { memberId, walkInName, visitType, amount } = parsed.data

    // Resolve member's numeric id if a memberId string was provided
    let memberNumericId: number | null = null
    if (memberId) {
      const member = await prisma.member.findUnique({
        where: { memberId },
        select: { id: true },
      })
      if (!member) {
        return NextResponse.json({ error: 'Member not found' }, { status: 404 })
      }
      memberNumericId = member.id
    }

    // Create Payment + Attendance atomically
    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          memberId: memberNumericId,
          walkInName: walkInName ?? null,
          staffId: session.userId,
          paymentType: visitType === 'daily' ? 'daily_visit' : 'monthly_plan',
          amount,
        },
      })

      const attendance = await tx.attendance.create({
        data: {
          memberId: memberNumericId,
          walkInName: walkInName ?? null,
          staffId: session.userId,
          visitType,
          checkInTime: new Date(),
        },
      })

      return { payment, attendance }
    })

    return NextResponse.json({ data: result }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/admin/checkin/confirm]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
