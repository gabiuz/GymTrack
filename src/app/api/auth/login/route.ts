import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

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

    // Find member by memberId OR contactNumber
    const member = await prisma.member.findFirst({
      where: {
        OR: [
          { memberId: identifier },
          { contactNumber: identifier },
        ],
      },
      include: {
        user: true,
      },
    })

    if (!member || !member.user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const passwordMatch = await bcrypt.compare(password, member.user.password)

    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    if (!member.user.isActive) {
      return NextResponse.json(
        { error: 'Account is inactive. Please contact staff.' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      message: 'Login successful',
      data: {
        memberId: member.memberId,
        fullName: member.fullName,
        contactNumber: member.contactNumber,
        gender: member.gender,
        photoUrl: member.photoUrl,
        qrCode: member.qrCode,
      },
    })
  } catch (error) {
    console.error('[POST /api/auth/login]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
