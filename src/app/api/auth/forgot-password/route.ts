import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomBytes, createHash } from 'node:crypto'

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { identifier } = body as { identifier?: string }

    if (!identifier?.trim()) {
      return NextResponse.json({ error: 'Identifier is required' }, { status: 400 })
    }

    const id = identifier.trim()

    // ── Try to find as a Member (customer login) ─────────────────────────────
    const member = await prisma.member.findFirst({
      where: {
        OR: [
          { memberId: id },
          { fullName: { equals: id, mode: 'insensitive' } },
        ],
      },
      include: { user: true },
    })

    let user = member?.user ?? null

    // ── Try to find as a Staff / Owner User directly ──────────────────────────
    if (!user) {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { username: { equals: id, mode: 'insensitive' } },
            { email:    { equals: id, mode: 'insensitive' } },
            { name:     { equals: id, mode: 'insensitive' } },
          ],
        },
      })
    }

    if (!user) {
      return NextResponse.json({ found: false })
    }

    // ── Generate a secure random token ────────────────────────────────────────
    const rawToken = randomBytes(32).toString('hex')
    const tokenHash = createHash('sha256').update(rawToken).digest('hex')
    const expiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: tokenHash,
        resetTokenExpiry: expiry,
      },
    })

    return NextResponse.json({
      found: true,
      token: rawToken,
      userName: user.name,
    })
  } catch (error) {
    console.error('[POST /api/auth/forgot-password] Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error)))
    return NextResponse.json({ error: 'Internal server error', detail: String(error) }, { status: 500 })
  }
}
