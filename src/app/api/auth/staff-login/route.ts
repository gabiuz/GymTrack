import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { signAdminToken, adminCookieOptions } from '@/lib/auth'

const StaffLoginSchema = z.object({
  identifier: z.string().min(1, 'Identifier is required'),
  password: z.string().min(1, 'Password is required'),
})

// ─── POST /api/auth/staff-login
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const parsed = StaffLoginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { identifier, password } = parsed.data

    // Find active staff/owner by username OR email OR name
    const user = await prisma.user.findFirst({
      where: {
        AND: [
          { isActive: true },
          { role: { in: ['staff', 'owner'] } },
          {
            OR: [
              { username: identifier },
              { email: identifier },
              { name: { equals: identifier, mode: 'insensitive' } },
            ],
          },
        ],
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const token = await signAdminToken({
      sub: String(user.id),
      userId: user.id,
      name: user.name,
      role: user.role,
    })

    const res = NextResponse.json({
      message: 'Login successful',
      data: { name: user.name, role: user.role },
    })

    res.cookies.set(adminCookieOptions(token))
    return res
  } catch (error) {
    console.error('[POST /api/auth/staff-login]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
