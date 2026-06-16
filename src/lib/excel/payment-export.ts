import ExcelJS from 'exceljs'

// ── Types ────────────────────────────────────────────────────────────────────

export interface ExportPayment {
  id:            number
  receiptNumber: string
  memberName:    string
  memberId:      string | null  // MEM-xxxxxx or null for walk-ins
  walkInName:    string | null
  paymentType:   string         // 'daily_visit' | 'monthly_plan' | 'membership_fee'
  amount:        number
  paymentDate:   string         // ISO string
  staffName:     string
  staffId:       number
}

interface PaymentSummary {
  totalRevenue:      number
  totalTransactions: number
  avgPerDay:         number
  byType: {
    dailyVisits:    number
    monthlyPlans:   number
    membershipFees: number
  }
  topStaff: Array<{ name: string; transactionCount: number; totalAmount: number }>
}

// ── Constants ────────────────────────────────────────────────────────────────

const DARK       = '0A0A0A'
const DARK2      = '111111'
const DARK3      = '1A1A1A'
const LIME       = 'C8FF00'
const WHITE      = 'FFFFFF'
const GRAY       = '888888'
const BORDER_CLR = '2A2A2A'

// ── Helpers ──────────────────────────────────────────────────────────────────

const darkFill = (shade = DARK2): ExcelJS.Fill =>
  ({ type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${shade}` } })

const thinBorder = (): Partial<ExcelJS.Borders> => ({
  top:    { style: 'thin', color: { argb: `FF${BORDER_CLR}` } },
  bottom: { style: 'thin', color: { argb: `FF${BORDER_CLR}` } },
  left:   { style: 'thin', color: { argb: `FF${BORDER_CLR}` } },
  right:  { style: 'thin', color: { argb: `FF${BORDER_CLR}` } },
})

const typeLabels: Record<string, string> = {
  daily_visit:    'Daily Visit',
  membership_fee: 'Membership Fee',
  monthly_plan:   'Monthly Plan',
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-PH', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtTime(d: Date): string {
  return d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
}

// ── Title block (reused on both sheets) ──────────────────────────────────────

function applyTitleBlock(
  sheet: ExcelJS.Worksheet,
  subtitle: string,
  rangeLabel: string,
  fromDate: Date,
  toDate: Date,
  exportedBy: string,
) {
  sheet.mergeCells('A1:I1')
  const r1 = sheet.getCell('A1')
  r1.value = 'GymTrack'
  r1.font  = { name: 'Arial', size: 18, bold: true, color: { argb: `FF${LIME}` } }
  r1.fill  = darkFill(DARK)
  r1.alignment = { horizontal: 'center', vertical: 'middle' }
  sheet.getRow(1).height = 36

  sheet.mergeCells('A2:I2')
  const r2 = sheet.getCell('A2')
  r2.value = `Payment ${subtitle} — ${rangeLabel}`
  r2.font  = { name: 'Arial', size: 12, bold: true, color: { argb: `FF${WHITE}` } }
  r2.fill  = darkFill(DARK)
  r2.alignment = { horizontal: 'center', vertical: 'middle' }
  sheet.getRow(2).height = 22

  sheet.mergeCells('A3:I3')
  const r3 = sheet.getCell('A3')
  r3.value = `Exported by: ${exportedBy}   ·   Period: ${fmtDate(fromDate)} – ${fmtDate(toDate)}   ·   Generated: ${fmtDate(new Date())} ${fmtTime(new Date())}`
  r3.font  = { name: 'Arial', size: 9, color: { argb: `FF${GRAY}` } }
  r3.fill  = darkFill(DARK)
  r3.alignment = { horizontal: 'center', vertical: 'middle' }
  sheet.getRow(3).height = 16
}

// ── Summary sheet helpers ─────────────────────────────────────────────────────

function addSectionHeader(sum: ExcelJS.Worksheet, row: number, label: string) {
  sum.mergeCells(`A${row}:F${row}`)
  const cell = sum.getCell(`A${row}`)
  cell.value = label
  cell.font  = { name: 'Arial', size: 10, bold: true, color: { argb: `FF${LIME}` } }
  cell.fill  = darkFill(DARK3)
  cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
  cell.border = thinBorder()
  sum.getRow(row).height = 20
}

function addKpiRow(sum: ExcelJS.Worksheet, row: number, label: string, value: string | number, format?: string) {
  const rw = sum.getRow(row)
  rw.height = 20

  const lbl = rw.getCell(1)
  lbl.value = label
  lbl.font  = { name: 'Arial', size: 10, color: { argb: 'FFCCCCCC' } }
  lbl.fill  = darkFill(DARK2)
  lbl.border = thinBorder()
  lbl.alignment = { indent: 2 }

  const val = rw.getCell(2)
  val.value = value
  val.font  = { name: 'Arial', size: 10, bold: true, color: { argb: `FF${WHITE}` } }
  val.fill  = darkFill(DARK2)
  val.border = thinBorder()
  val.alignment = { horizontal: 'right' }
  if (format) val.numFmt = format

  for (let c = 3; c <= 6; c++) {
    const cell = rw.getCell(c)
    cell.fill   = darkFill(DARK2)
    cell.border = thinBorder()
  }
}

// ── Build summary from raw payments ──────────────────────────────────────────

function buildSummary(payments: ExportPayment[], fromDate: Date, toDate: Date): PaymentSummary {
  const totalRevenue      = payments.reduce((s, p) => s + p.amount, 0)
  const totalTransactions = payments.length
  const dayDiff           = Math.max(1, Math.ceil((toDate.getTime() - fromDate.getTime()) / 86400000))
  const avgPerDay         = totalRevenue / dayDiff

  const byType = {
    dailyVisits:    payments.filter((p) => p.paymentType === 'daily_visit').reduce((s, p) => s + p.amount, 0),
    monthlyPlans:   payments.filter((p) => p.paymentType === 'monthly_plan').reduce((s, p) => s + p.amount, 0),
    membershipFees: payments.filter((p) => p.paymentType === 'membership_fee').reduce((s, p) => s + p.amount, 0),
  }

  const staffMap = new Map<number, { name: string; transactionCount: number; totalAmount: number }>()
  for (const p of payments) {
    const entry = staffMap.get(p.staffId) ?? { name: p.staffName, transactionCount: 0, totalAmount: 0 }
    entry.transactionCount++
    entry.totalAmount += p.amount
    staffMap.set(p.staffId, entry)
  }
  const topStaff = Array.from(staffMap.values())
    .sort((a, b) => b.transactionCount - a.transactionCount)
    .slice(0, 5)

  return { totalRevenue, totalTransactions, avgPerDay, byType, topStaff }
}

// ── Main generator ────────────────────────────────────────────────────────────

export async function generatePaymentExport(
  payments: ExportPayment[],
  exportedBy: string,
  rangeLabel: string,
  fromDate: Date,
  toDate: Date,
): Promise<Buffer> {
  const summary = buildSummary(payments, fromDate, toDate)

  const wb = new ExcelJS.Workbook()
  wb.creator = 'GymTrack'
  wb.created = new Date()

  // ─── SHEET 1: Summary ───────────────────────────────────────────────────────

  const sum = wb.addWorksheet('Summary')
  sum.columns = [
    { width: 28 }, { width: 18 }, { width: 10 },
    { width: 10 }, { width: 10 }, { width: 10 },
  ]

  applyTitleBlock(sum, 'Report', rangeLabel, fromDate, toDate, exportedBy)

  // Row 4 spacer
  sum.getRow(4).height = 8
  sum.getCell('A4').fill = darkFill(DARK)

  // SUMMARY section
  addSectionHeader(sum, 5, 'SUMMARY')
  addKpiRow(sum, 6, 'Total Revenue',      summary.totalRevenue,      '₱ #,##0.00')
  addKpiRow(sum, 7, 'Total Transactions', summary.totalTransactions)
  addKpiRow(sum, 8, 'Average per Day',    summary.avgPerDay,         '₱ #,##0.00')

  sum.getRow(9).height = 8

  // REVENUE BY TYPE
  addSectionHeader(sum, 10, 'REVENUE BY TYPE')
  addKpiRow(sum, 11, 'Daily Visits',    summary.byType.dailyVisits,    '₱ #,##0.00')
  addKpiRow(sum, 12, 'Monthly Plans',   summary.byType.monthlyPlans,   '₱ #,##0.00')
  addKpiRow(sum, 13, 'Membership Fees', summary.byType.membershipFees, '₱ #,##0.00')

  // Percentage formula cells
  for (const [rowNum, formula] of [[11, '=B11/B6'], [12, '=B12/B6'], [13, '=B13/B6']] as const) {
    const pct = sum.getCell(`C${rowNum}`)
    pct.value = { formula } as ExcelJS.CellFormulaValue
    pct.numFmt = '0.0%'
    pct.font   = { name: 'Arial', size: 10, color: { argb: `FF${GRAY}` } }
    pct.fill   = darkFill(DARK2)
    pct.border = thinBorder()
    pct.alignment = { horizontal: 'right' }
  }

  sum.getRow(14).height = 8

  // TOP STAFF section
  addSectionHeader(sum, 15, 'TOP STAFF BY TRANSACTIONS')
  summary.topStaff.forEach((staff, i) => {
    const row = 16 + i
    addKpiRow(sum, row, staff.name, staff.transactionCount)
    const amtCell = sum.getCell(`C${row}`)
    amtCell.value = staff.totalAmount
    amtCell.numFmt = '₱ #,##0.00'
    amtCell.font   = { name: 'Arial', size: 10, color: { argb: `FF${GRAY}` } }
    amtCell.fill   = darkFill(DARK2)
    amtCell.border = thinBorder()
    amtCell.alignment = { horizontal: 'right' }
  })

  // ─── SHEET 2: Transactions ──────────────────────────────────────────────────

  const trx = wb.addWorksheet('Transactions')
  trx.columns = [
    { key: 'num',     width: 6  },
    { key: 'receipt', width: 22 },
    { key: 'date',    width: 14 },
    { key: 'time',    width: 12 },
    { key: 'name',    width: 24 },
    { key: 'memId',   width: 14 },
    { key: 'type',    width: 18 },
    { key: 'staff',   width: 20 },
    { key: 'amount',  width: 14 },
  ]

  applyTitleBlock(trx, 'Transactions', rangeLabel, fromDate, toDate, exportedBy)
  trx.getRow(4).height = 8
  trx.getRow(5).height = 8

  // Header row (row 6)
  const HEADERS = ['#', 'Receipt No.', 'Date', 'Time', 'Member Name', 'Member ID', 'Payment Type', 'Handled By', 'Amount (₱)']
  const headerRow = trx.getRow(6)
  headerRow.height = 22
  HEADERS.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1)
    cell.value = h
    cell.font  = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF000000' } }
    cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${LIME}` } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = {
      top:    { style: 'medium', color: { argb: 'FF999900' } },
      bottom: { style: 'medium', color: { argb: 'FF999900' } },
      left:   { style: 'thin',   color: { argb: 'FF999900' } },
      right:  { style: 'thin',   color: { argb: 'FF999900' } },
    }
  })

  // Data rows
  payments.forEach((p, i) => {
    const rowIndex = 7 + i
    const isOdd    = i % 2 === 0
    const fillClr  = isOdd ? DARK2 : DARK3
    const rw = trx.getRow(rowIndex)
    rw.height = 18

    const isWalkIn = !p.memberId
    const pDate    = new Date(p.paymentDate)

    const cols: Array<{ value: ExcelJS.CellValue; extra?: Partial<ExcelJS.Cell> }> = [
      { value: i + 1 },
      { value: p.receiptNumber },
      {
        value: pDate,
        extra: { numFmt: 'DD MMM YYYY', alignment: { horizontal: 'center' } },
      },
      {
        value: pDate,
        extra: { numFmt: 'h:MM AM/PM', alignment: { horizontal: 'center' } },
      },
      { value: isWalkIn ? (p.walkInName || p.memberName || 'Guest') : p.memberName },
      {
        value: isWalkIn ? 'Walk-in' : (p.memberId ?? ''),
        extra: {
          font: { name: 'Courier New', size: 10, italic: isWalkIn, color: { argb: isWalkIn ? `FF${GRAY}` : 'FFAAAAAA' } },
          alignment: { horizontal: 'center' },
        },
      },
      { value: typeLabels[p.paymentType] ?? p.paymentType },
      { value: p.staffName },
      {
        value: p.amount,
        extra: {
          numFmt: '₱ #,##0.00',
          font:   { name: 'Arial', size: 10, bold: true, color: { argb: `FF${LIME}` } },
          alignment: { horizontal: 'right' },
        },
      },
    ]

    cols.forEach(({ value, extra }, ci) => {
      const cell = rw.getCell(ci + 1)
      cell.fill   = darkFill(fillClr)
      cell.border = thinBorder()

      cell.value = value
      // Default font for this row
      if (!extra?.font) {
        cell.font = { name: 'Arial', size: 10, color: { argb: `FF${WHITE}` } }
      }
      if (extra) {
        if (extra.numFmt)    cell.numFmt    = extra.numFmt
        if (extra.font)      cell.font      = extra.font as ExcelJS.Font
        if (extra.alignment) cell.alignment = extra.alignment as ExcelJS.Alignment
      }
    })
  })

  // Totals row
  const totalRowIndex = 7 + payments.length
  const totalRow = trx.getRow(totalRowIndex)
  totalRow.height = 22

  trx.mergeCells(`A${totalRowIndex}:H${totalRowIndex}`)
  const totalLabel = totalRow.getCell(1)
  totalLabel.value = 'TOTAL'
  totalLabel.font  = { name: 'Arial', size: 10, bold: true, color: { argb: `FF${LIME}` } }
  totalLabel.fill  = darkFill(DARK3)
  totalLabel.alignment = { horizontal: 'right', vertical: 'middle', indent: 2 }
  totalLabel.border = {
    top:    { style: 'medium', color: { argb: `FF${LIME}` } },
    ...thinBorder(),
  }

  const totalAmount = totalRow.getCell(9)
  // If no payments, still put 0 rather than a broken formula
  totalAmount.value = payments.length > 0
    ? ({ formula: `=SUM(I7:I${totalRowIndex - 1})` } as ExcelJS.CellFormulaValue)
    : 0
  totalAmount.numFmt = '₱ #,##0.00'
  totalAmount.font   = { name: 'Arial', size: 11, bold: true, color: { argb: `FF${LIME}` } }
  totalAmount.fill   = darkFill(DARK3)
  totalAmount.alignment = { horizontal: 'right', vertical: 'middle' }
  totalAmount.border = {
    top:    { style: 'medium', color: { argb: `FF${LIME}` } },
    ...thinBorder(),
  }

  // Freeze header row + auto filter
  trx.views = [{ state: 'frozen', xSplit: 0, ySplit: 6 }]
  trx.autoFilter = { from: { row: 6, column: 1 }, to: { row: 6, column: 9 } }

  // ─── Write buffer ────────────────────────────────────────────────────────────

  const rawBuffer = await wb.xlsx.writeBuffer()
  return Buffer.from(rawBuffer) as unknown as Buffer
}
