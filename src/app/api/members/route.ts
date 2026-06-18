import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@/generated/prisma'
import bcrypt from 'bcryptjs'
import QRCode from 'qrcode'
import { z } from 'zod'
import {
  signToken,
  sessionCookieOptions,
  ADMIN_SESSION_COOKIE,
  OWNER_SESSION_COOKIE,
  verifyAdminToken,
  verifyOwnerToken,
} from '@/lib/auth'

// ─── Verify either admin or owner session cookie
async function requireStaffOrOwner(req: NextRequest) {
  const adminToken = req.cookies.get(ADMIN_SESSION_COOKIE)?.value
  const ownerToken = req.cookies.get(OWNER_SESSION_COOKIE)?.value
  const token = ownerToken ?? adminToken
  if (!token) return null
  const payload = await (ownerToken ? verifyOwnerToken(ownerToken) : verifyAdminToken(adminToken!))
  return payload
}

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
    const session = await requireStaffOrOwner(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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

    const now = new Date()

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
          memberships: {
            orderBy: { endDate: 'desc' },
            take: 1,
            select: { endDate: true },
          },
          monthlyPlans: {
            orderBy: { endDate: 'desc' },
            take: 1,
            select: { endDate: true },
          },
        },
      }),
      prisma.member.count({ where }),
    ])

    const data = members.map((m) => {
      const latestMembership = m.memberships[0] ?? null
      const latestPlan = m.monthlyPlans[0] ?? null
      const hasActiveMembership = latestMembership ? latestMembership.endDate >= now : false
      const hasActivePlan = latestPlan ? latestPlan.endDate >= now : false

      const membershipStatus = hasActivePlan || hasActiveMembership
        ? 'active'
        : latestMembership || latestPlan
        ? 'expired'
        : 'unassigned'

      return {
        id: m.id,
        memberId: m.memberId,
        fullName: m.fullName,
        contactNumber: m.contactNumber,
        gender: m.gender,
        photoUrl: m.photoUrl,
        createdAt: m.createdAt,
        membershipStatus,
      }
    })

    return NextResponse.json({ data, total, page, limit })
  } catch (error) {
    console.error('[GET /api/members]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── POST /api/members  (public — customer self-registration)
export async function POST(req: NextRequest) {
  try {
    const postSession = await requireStaffOrOwner(req)
    if (!postSession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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