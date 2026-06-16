import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireOwnerSession } from '@/lib/auth'
import { z } from 'zod'

const EditStaffSchema = z.object({
  name:     z.string().min(1).optional(),
  username: z.string().min(3).max(30).optional(),
  role:     z.enum(['staff', 'owner']).optional(),
})

// ─── PATCH /api/owner/staff/[id] ────────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireOwnerSession(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const targetId = parseInt(id, 10)
    if (isNaN(targetId)) return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })

    const body = await req.json()
    const parsed = EditStaffSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })

    const { name, username, role } = parsed.data

    // Guard: cannot self-demote
    if (targetId === session.userId && role && role !== 'owner') {
      return NextResponse.json({ error: 'You cannot change your own role' }, { status: 400 })
    }

    // Check username uniqueness (exclude self)
    if (username) {
      const existing = await prisma.user.findFirst({ where: { username, NOT: { id: targetId } } })
      if (existing) return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
    }

    const updated = await prisma.user.update({
      where: { id: targetId },
      data: {
        ...(name     !== undefined && { name }),
        ...(username !== undefined && { username }),
        ...(role     !== undefined && { role }),
      },
      select: { id: true, name: true, username: true, email: true, role: true, isActive: true },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('[PATCH /api/owner/staff/[id]]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
