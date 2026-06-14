import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@/generated/prisma'
import bcrypt from 'bcryptjs'
import QRCode from 'qrcode'
import { z } from 'zod'
import { signToken, sessionCookieOptions } from '@/lib/auth'

// ─── Validation schema
const CreateMemberSchema = z.object({
  fullName: z.string().min(2, 'Full name is too short').max(100),
  contactNumber: z
    .string()
    .regex(/^(09|\+639)\d{9}$/, 'Invalid Philippine mobile number (e.g. 09171234567)'),
  address: z.string().min(5, 'Address is too short').max(300),
  gender: z.enum(['Male', 'Female', 'Other']),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional()
    .nullable(),
  emergencyContact: z.string().max(200).optional().nullable(),
  // Must be a real HTTPS URL (Cloudinary) or absent — NOT a base64 string
  photoUrl: z
    .string()
    .url('photoUrl must be a valid URL')
    .startsWith('https://', 'photoUrl must be an HTTPS URL')
    .optional()
    .nullable(),
})

// ─── Helper: generate next Member ID
async function generateMemberId(tx: Prisma.TransactionClient): Promise<string> {
  const latest = await tx.member.findFirst({
    orderBy: { id: 'desc' },
    select: { memberId: true },
  })
  if (!latest) return 'MEM-000001'
  const lastNumber = parseInt(latest.memberId.replace('MEM-', ''), 10)
  return `MEM-${String(lastNumber + 1).padStart(6, '0')}`
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

    // ── Validate with Zod
    const parsed = CreateMemberSchema.safeParse(body)
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]
      return NextResponse.json(
        { error: firstError.message, field: firstError.path[0] },
        { status: 400 }
      )
    }

    const { fullName, contactNumber, address, gender, dateOfBirth, emergencyContact, photoUrl } =
      parsed.data

    // ── Validate dateOfBirth is a real calendar date
    if (dateOfBirth && isNaN(new Date(dateOfBirth).getTime())) {
      return NextResponse.json(
        { error: 'Invalid dateOfBirth — expected YYYY-MM-DD' },
        { status: 400 }
      )
    }

    // ── Check for duplicate contact number
    const existing = await prisma.member.findUnique({ where: { contactNumber } })
    if (existing) {
      return NextResponse.json(
        { error: 'A member with this contact number already exists' },
        { status: 409 }
      )
    }

    const result = await prisma.$transaction(async (tx) => {
      const memberId = await generateMemberId(tx)

      const qrCode = await QRCode.toDataURL(memberId, { width: 300, margin: 2 })

      const user = await tx.user.create({
        data: {
          name: fullName,
          role: 'customer',
          password: await bcrypt.hash(contactNumber, 10),
        },
      })

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

    // ── Sign JWT and set session cookie so user is logged in immediately
    const token = await signToken({
      sub: result.memberId,
      memberId: result.memberId,
      fullName: result.fullName,
    })

    const res = NextResponse.json(
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

    res.cookies.set(sessionCookieOptions(token))
    return res
  } catch (error) {
    console.error('[POST /api/members]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}