import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireOwnerSession } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const CreateStaffSchema = z.object({
  name:     z.string().min(1),
  username: z.string().min(3).max(30),
  email:    z.string().email().optional(),
  role:     z.enum(['staff', 'owner']),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

// ─── GET /api/owner/staff ────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await requireOwnerSession(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const users = await prisma.user.findMany({
      where: { role: { in: ['staff', 'owner'] } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, username: true, email: true, role: true, isActive: true, createdAt: true },
    })

    // Derive lastActive per user
    const data = await Promise.all(
      users.map(async (u) => {
        const [lastPayment, lastAttendance] = await Promise.all([
          prisma.payment.findFirst({
            where: { staffId: u.id },
            orderBy: { paymentDate: 'desc' },
            select: { paymentDate: true },
          }),
          prisma.attendance.findFirst({
            where: { staffId: u.id },
            orderBy: { checkInTime: 'desc' },
            select: { checkInTime: true },
          }),
        ])

        const candidates = [lastPayment?.paymentDate, lastAttendance?.checkInTime].filter(Boolean) as Date[]
        const lastActive = candidates.length > 0
          ? candidates.sort((a, b) => b.getTime() - a.getTime())[0].toISOString()
          : null

        return {
          id:         u.id,
          name:       u.name,
          username:   u.username,
          email:      u.email,
          role:       u.role,
          isActive:   u.isActive,
          lastActive,
          createdAt:  u.createdAt.toISOString(),
          isYou:      u.id === session.userId,
        }
      })
    )

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[GET /api/owner/staff]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── POST /api/owner/staff ───────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await requireOwnerSession(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = CreateStaffSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

    const { name, username, email, role, password } = parsed.data

    // Username uniqueness
    const existingUsername = await prisma.user.findFirst({ where: { username } })
    if (existingUsername) return NextResponse.json({ error: 'Username already taken' }, { status: 409 })

    // Email uniqueness (if provided)
    if (email) {
      const existingEmail = await prisma.user.findFirst({ where: { email } })
      if (existingEmail) return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { name, username, email: email ?? null, role, password: hashedPassword, isActive: true },
      select: { id: true, name: true, username: true, email: true, role: true, isActive: true, createdAt: true },
    })

    return NextResponse.json({ data: { ...user, createdAt: user.createdAt.toISOString() } }, { status: 201 })
  } catch (error) {
    console.error('[POST /api/owner/staff]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
