import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireOwnerSession } from '@/lib/auth'

// ─── PATCH /api/owner/staff/[id]/toggle ──────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireOwnerSession(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const targetId = parseInt(id, 10)
    if (isNaN(targetId)) return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })

    // Guard: cannot disable own account
    if (targetId === session.userId) {
      return NextResponse.json({ error: 'You cannot disable your own account' }, { status: 400 })
    }

    const current = await prisma.user.findUnique({ where: { id: targetId }, select: { isActive: true } })
    if (!current) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const updated = await prisma.user.update({
      where: { id: targetId },
      data: { isActive: !current.isActive },
      select: { id: true, name: true, isActive: true },
    })

    return NextResponse.json({ data: updated })
  } catch (error) {
    console.error('[PATCH /api/owner/staff/[id]/toggle]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
