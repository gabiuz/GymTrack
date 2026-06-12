import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@/generated/prisma'
import bcrypt from 'bcryptjs'
import QRCode from 'qrcode'

// ─── Helper: generate next Member ID
async function generateMemberId(tx: Prisma.TransactionClient): Promise<string> {
  const latest = await tx.member.findFirst({
    orderBy: { id: 'desc' },
    select: { memberId: true },
  })

  if (!latest) return 'MEM-000001'

  const lastNumber = parseInt(latest.memberId.replace('MEM-', ''), 10)
  const nextNumber = lastNumber + 1
  return `MEM-${String(nextNumber).padStart(6, '0')}`
}

// ─── GET /api/members
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') ?? ''
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '20', 10))

    const where: Prisma.MemberWhereInput = search
      ? {
        OR: [
          { fullName: { contains: search, mode: 'insensitive' } },
          { contactNumber: { contains: search } },
          { memberId: { contains: search, mode: 'insensitive' } },
        ],
      }
      : {}

    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          memberId: true,
          fullName: true,
          contactNumber: true,
          gender: true,
          photoUrl: true,
          createdAt: true,
        },
      }),
      prisma.member.count({ where }),
    ])

    return NextResponse.json({ data: members, total, page, limit })
  } catch (error) {
    console.error('[GET /api/members]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── POST /api/members
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      fullName,
      contactNumber,
      address,
      gender,
      dateOfBirth,
      emergencyContact,
      photoUrl,
    } = body

    // ── Validate required fields
    if (!fullName || !contactNumber || !address || !gender) {
      return NextResponse.json(
        { error: 'fullName, contactNumber, address, and gender are required' },
        { status: 400 }
      )
    }

    if (dateOfBirth && isNaN(new Date(dateOfBirth).getTime())) {
      return NextResponse.json(
        { error: 'Invalid dateOfBirth — expected an ISO 8601 date string' },
        { status: 400 }
      )
    }

    // ── Check if contact number already exists
    const existing = await prisma.member.findUnique({
      where: { contactNumber },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A member with this contact number already exists' },
        { status: 409 }
      )
    }

    const result = await prisma.$transaction(async (tx) => {

      // 1. Generate Member ID inside the transaction
      const memberId = await generateMemberId(tx)

      // 2. Pre-generate QR code
      const qrCode = await QRCode.toDataURL(memberId, {
        width: 300,
        margin: 2,
      })

      // 3. Create User login account, default pass is contactnum
      const user = await tx.user.create({
        data: {
          name: fullName,
          role: 'customer',
          password: await bcrypt.hash(contactNumber, 10),
        },
      })

      // 4. Create Member profile
      const member = await tx.member.create({
        data: {
          memberId,
          userId: user.id,
          fullName,
          contactNumber,
          address,
          gender,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          emergencyContact: emergencyContact ?? null,
          photoUrl: photoUrl ?? null,
          qrCode,
        },
      })

      return member
    })

    return NextResponse.json(
      {
        message: 'Member registered successfully',
        data: {
          memberId: result.memberId,
          fullName: result.fullName,
          contactNumber: result.contactNumber,
          qrCode: result.qrCode,
          createdAt: result.createdAt,
        },
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('[POST /api/members]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}