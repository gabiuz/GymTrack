import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { signOwnerToken, ownerCookieOptions } from '@/lib/auth'

const OwnerLoginSchema = z.object({
  identifier: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
})

// ─── POST /api/auth/owner-login ──────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = OwnerLoginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
    }

    const { identifier, password } = parsed.data

    // Find user where (username OR email OR name) matches AND role=owner AND isActive
    const user = await prisma.user.findFirst({
      where: {
        role: 'owner',
        isActive: true,
        OR: [
          { username: { equals: identifier, mode: 'insensitive' } },
          { email: { equals: identifier, mode: 'insensitive' } },
          { name: { equals: identifier, mode: 'insensitive' } },
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

    const token = await signOwnerToken({
      sub: String(user.id),
      userId: user.id,
      name: user.name,
      role: 'owner',
    })

    const response = NextResponse.json({
      message: 'Login successful',
      user: { id: user.id, name: user.name, role: user.role },
    })
    response.cookies.set(ownerCookieOptions(token))
    return response
  } catch (error) {
    console.error('[POST /api/auth/owner-login]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
