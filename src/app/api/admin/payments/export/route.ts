import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffSession } from '@/lib/auth'
import { generatePaymentExport, type ExportPayment } from '@/lib/excel/payment-export'

function startOfDay(d: Date)   { return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0) }
function endOfDay(d: Date)     { return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999) }
function startOfWeek(d: Date)  {
  const diff = d.getDay() === 0 ? -6 : 1 - d.getDay()
  const mon = new Date(d); mon.setDate(d.getDate() + diff); return startOfDay(mon)
}
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0) }

const RANGE_LABELS: Record<string, string> = {
  today: 'Today',
  week:  'This Week',
  month: 'This Month',
}

// ─── GET /api/admin/payments/export?range=today|week|month ───────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await requireStaffSession(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    let range = searchParams.get('range') ?? 'today'
    if (!['today', 'week', 'month'].includes(range)) {
      range = 'today'
    }

    const now = new Date()
    const rangeFilter: Record<string, { from: Date; to: Date }> = {
      today: { from: startOfDay(now),   to: endOfDay(now) },
      week:  { from: startOfWeek(now),  to: endOfDay(now) },
      month: { from: startOfMonth(now), to: endOfDay(now) },
    }
    const { from, to } = rangeFilter[range] ?? rangeFilter['today']

    const payments = await prisma.payment.findMany({
      where: { paymentDate: { gte: from, lte: to } },
      include: {
        member: { select: { memberId: true, fullName: true } },
        staff:  { select: { id: true, name: true } },
      },
      orderBy: { paymentDate: 'asc' },
    })

    const exportRows: ExportPayment[] = payments.map((p) => ({
      id:            p.id,
      receiptNumber: p.receiptNumber,
      memberName:    p.member?.fullName ?? p.walkInName ?? 'Guest',
      memberId:      p.member?.memberId ?? null,
      walkInName:    p.walkInName ?? null,
      paymentType:   p.paymentType,
      amount:        Number(p.amount),
      paymentDate:   p.paymentDate.toISOString(),
      staffName:     p.staff.name,
      staffId:       p.staff.id,
    }))

    const rangeLabel = RANGE_LABELS[range]
    const buffer = await generatePaymentExport(exportRows, session.name, rangeLabel, from, to)

    // Filename: GymTrack_Payments_Today_16-Jun-2026.xlsx
    const dateSuffix = now.toLocaleDateString('en-PH', {
      day: '2-digit', month: 'short', year: 'numeric',
    }).replace(/ /g, '-')
    const rangeSlug = { today: 'Today', week: 'This-Week', month: 'This-Month' }[range]
    const filename  = `GymTrack_Payments_${rangeSlug}_${dateSuffix}.xlsx`

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type':        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control':       'no-store',
      },
    })
  } catch (error) {
    console.error('[GET /api/admin/payments/export]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
