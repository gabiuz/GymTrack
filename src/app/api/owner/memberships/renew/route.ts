import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireOwnerSession } from '@/lib/auth'
import { z } from 'zod'

const RenewSchema = z.object({ memberId: z.number().int().positive() })

// ─── POST /api/owner/memberships/renew ──────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await requireOwnerSession(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = RenewSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

    const { memberId } = parsed.data

    const member = await prisma.member.findUnique({ where: { id: memberId }, select: { id: true } })
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

    const now = new Date()
    const latest = await prisma.membership.findFirst({ where: { memberId }, orderBy: { endDate: 'desc' } })

    if (latest && latest.endDate >= now) {
      return NextResponse.json({ error: 'Membership is currently active — cannot renew yet' }, { status: 409 })
    }

    const startDate = latest && latest.endDate > now ? latest.endDate : now
    const endDate = new Date(startDate)
    endDate.setFullYear(endDate.getFullYear() + 1)

    const result = await prisma.$transaction(async (tx) => {
      const membership = await tx.membership.create({ data: { memberId, startDate, endDate } })
      const payment = await tx.payment.create({
        data: { memberId, staffId: session.userId, paymentType: 'membership_fee', amount: 200 },
      })
      return { membership, payment }
    })

    return NextResponse.json({ data: result }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/owner/memberships/renew]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
