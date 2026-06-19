import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { signToken, sessionCookieOptions } from '@/lib/auth'

// ─── POST /api/auth/login
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { identifier, password } = body

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'identifier and password are required' },
        { status: 400 }
      )
    }

    const trimmedIdentifier = identifier.trim()

    // Find member by memberId, OR full name (case-insensitive)
    const member = await prisma.member.findFirst({
      where: {
        OR: [
          { memberId: trimmedIdentifier },
          { fullName: { equals: trimmedIdentifier, mode: 'insensitive' } },
        ],
      },
      include: { user: true },
    })

    if (!member || !member.user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const passwordMatch = await bcrypt.compare(password, member.user.password)
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    if (!member.user.isActive) {
      return NextResponse.json(
        { error: 'Account is inactive. Please contact staff.' },
        { status: 403 }
      )
    }

    // ── Sign JWT and set HTTP-only session cookie
    const token = await signToken({
      sub: member.memberId,
      memberId: member.memberId,
      fullName: member.fullName,
    })

    const res = NextResponse.json({
      message: 'Login successful',
      data: {
        memberId: member.memberId,
        fullName: member.fullName,
        photoUrl: member.photoUrl,
        qrCode: member.qrCode,
      },
    })

    res.cookies.set(sessionCookieOptions(token))
    return res
  } catch (error) {
    console.error('[POST /api/auth/login]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
