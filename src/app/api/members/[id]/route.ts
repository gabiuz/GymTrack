import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { requireStaffSession } from '@/lib/auth'

const EditMemberSchema = z.object({
  fullName: z.string().min(1).optional(),
  contactNumber: z.string().regex(/^09\d{9}$/).optional(),
  address: z.string().min(1).optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  dateOfBirth: z.string().datetime({ offset: true }).optional().nullable(),
  emergencyContact: z.string().optional().nullable(),
  photoUrl: z.string().url().optional().nullable(),
})

// ─── GET /api/members/:id
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireStaffSession(req)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const numericId = parseInt(id, 10)

    // Support lookup by numeric id or by memberId string (MEM-XXXXXX)
    const member = isNaN(numericId)
      ? await prisma.member.findUnique({ where: { memberId: id } })
      : await prisma.member.findUnique({ where: { id: numericId } })

    if (!member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    const now = new Date()

    // Derive status from memberships / monthly plans
    const [latestMembership, latestPlan] = await Promise.all([
      prisma.membership.findFirst({
        where: { memberId: member.id },
        orderBy: { endDate: 'desc' },
      }),
      prisma.monthlyPlan.findFirst({
        where: { memberId: member.id },
        orderBy: { endDate: 'desc' },
      }),
    ])

    return NextResponse.json({
      data: {
        ...member,
        hasActiveMembership: latestMembership ? latestMembership.endDate >= now : false,
        latestMembership: latestMembership ?? null,
        hasActiveMonthlyPlan: latestPlan ? latestPlan.endDate >= now : false,
        latestMonthlyPlan: latestPlan ?? null,
      },
    })
  } catch (error) {
    console.error('[GET /api/members/:id]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── PATCH /api/members/:id
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireStaffSession(req)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const numericId = parseInt(id, 10)
    if (isNaN(numericId)) {
      return NextResponse.json({ error: 'Invalid member ID' }, { status: 400 })
    }

    const body = await req.json()
    const parsed = EditMemberSchema.safeParse(body)
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]
      return NextResponse.json(
        { error: firstError.message, field: firstError.path[0] },
        { status: 400 }
      )
    }

    const data = parsed.data

    // Check contactNumber uniqueness (exclude self)
    if (data.contactNumber) {
      const conflict = await prisma.member.findFirst({
        where: {
          contactNumber: data.contactNumber,
          id: { not: numericId },
        },
      })
      if (conflict) {
        return NextResponse.json(
          { error: 'Contact number already in use by another member', field: 'contactNumber' },
          { status: 409 }
        )
      }
    }

    const updated = await prisma.member.update({
      where: { id: numericId },
      data: {
        ...(data.fullName !== undefined && { fullName: data.fullName }),
        ...(data.contactNumber !== undefined && { contactNumber: data.contactNumber }),
        ...(data.address !== undefined && { address: data.address }),
        ...(data.gender !== undefined && { gender: data.gender }),
        ...(data.dateOfBirth !== undefined && {
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        }),
        ...(data.emergencyContact !== undefined && { emergencyContact: data.emergencyContact }),
        ...(data.photoUrl !== undefined && { photoUrl: data.photoUrl }),
      },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('[PATCH /api/members/:id]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
