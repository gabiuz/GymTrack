# GymTrack — Payment Export to Excel Spec

> **Scope:** Export button on the Payments page (both Admin and Owner portals)
> **Goal:** Generate a professional, well-formatted `.xlsx` file from the currently filtered payment data
> **Library:** `exceljs` (preferred over `xlsx` shim for full styling support in Next.js)

---

## 0. Install Dependency

```bash
npm install exceljs
```

---

## 1. Export Trigger

The export button already exists on the Payments page in both portals but is currently a no-op. Wire it to call:

```
GET /api/admin/payments/export?range=today|week|month
GET /api/owner/payments/export?range=today|week|month
```

The range must match whatever the staff/owner currently has selected in the filter chips. Export only what they are looking at — not all payments ever.

On the frontend:

```ts
const handleExport = async () => {
  const res = await fetch(`/api/admin/payments/export?range=${activeRange}`)
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `GymTrack_Payments_${activeRange}_${formatDate(new Date())}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}
```

---

## 2. Export API Endpoint

```ts
// src/app/api/admin/payments/export/route.ts
// src/app/api/owner/payments/export/route.ts

import ExcelJS from 'exceljs'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  // 1. Auth check (same as GET /api/admin/payments)
  // 2. Parse range param
  // 3. Query payments
  // 4. Generate workbook (see Section 3)
  // 5. Return as file download

  const buffer = await workbook.xlsx.writeBuffer()

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="GymTrack_Payments.xlsx"`,
    },
  })
}
```

---

## 3. Workbook Structure

The exported file has **two sheets:**

| Sheet | Purpose |
|-------|---------|
| `Summary` | KPI snapshot for the selected period — totals, averages, breakdown by type |
| `Transactions` | Full paginated list of every payment record in the selected range |

---

## 4. Sheet 1 — Summary

### Layout

```
Row 1:  [GymTrack logo text / gym name]              ← merged A1:F1, large bold lime text on dark bg
Row 2:  [Payment Report — {Range Label}]             ← merged A2:F2, subtitle
Row 3:  [Exported: {date} {time}  |  Period: {from} – {to}]  ← merged A3:F3, small gray text
Row 4:  [empty spacer]
Row 5:  SUMMARY                                      ← section header
Row 6:  Total Revenue       ₱ XX,XXX.XX
Row 7:  Total Transactions  ###
Row 8:  Average per Day     ₱ X,XXX.XX
Row 9:  [empty spacer]
Row 10: REVENUE BY TYPE                              ← section header
Row 11: Daily Visits        ₱ XX,XXX.XX    XX%
Row 12: Monthly Plans       ₱ XX,XXX.XX    XX%
Row 13: Membership Fees     ₱ XX,XXX.XX    XX%
Row 14: [empty spacer]
Row 15: TOP STAFF           ← section header (who recorded the most transactions)
Row 16: [Staff Name]        ## transactions    ₱ XX,XXX.XX
Row 17: [Staff Name]        ## transactions    ₱ XX,XXX.XX
Row 18: [Staff Name]        ## transactions    ₱ XX,XXX.XX
```

### Styling

| Element | Style |
|---------|-------|
| Row 1 — gym name | Font: Arial 18 bold · Color: `#C8FF00` (lime) · Fill: `#0A0A0A` (dark) · Merged A1:F1 · Center aligned |
| Row 2 — report title | Font: Arial 12 bold · Color: `#FFFFFF` · Fill: `#0A0A0A` · Merged A2:F2 · Center aligned |
| Row 3 — metadata | Font: Arial 9 · Color: `#888888` · Fill: `#0A0A0A` · Merged A3:F3 · Center aligned |
| Section headers (SUMMARY, REVENUE BY TYPE, TOP STAFF) | Font: Arial 10 bold · Color: `#C8FF00` · Fill: `#1A1A1A` · All caps · Merged A:F |
| Label cells (col A) | Font: Arial 10 · Color: `#CCCCCC` · Fill: `#111111` |
| Value cells (col B) | Font: Arial 10 bold · Color: `#FFFFFF` · Fill: `#111111` · Right aligned |
| Percentage cells (col C) | Font: Arial 10 · Color: `#888888` · Fill: `#111111` · Format: `0.0%` |
| All borders | Thin border · Color: `#2A2A2A` |

### Column widths — Summary sheet

| Column | Width |
|--------|-------|
| A | 28 |
| B | 18 |
| C | 10 |
| D–F | 10 |

### Formulas to use (not hardcoded Python values)

```ts
// Percentage breakdown — use Excel formulas, not Python calculations
sheet.getCell('C11').value = { formula: '=B11/B6' }   // Daily visits %
sheet.getCell('C12').value = { formula: '=B12/B6' }   // Monthly plans %
sheet.getCell('C13').value = { formula: '=B13/B6' }   // Membership fees %
// Format C11:C13 as percentage: '0.0%'

// Total check — B11+B12+B13 must equal B6
sheet.getCell('B14').value = { formula: '=B11+B12+B13' }  // hidden row for validation
```

---

## 5. Sheet 2 — Transactions

### Column definitions

| Col | Header | Data field | Width | Format |
|-----|--------|------------|-------|--------|
| A | # | Row number | 6 | Integer |
| B | Receipt No. | `receiptNumber` | 20 | Text |
| C | Date | `paymentDate` | 16 | `DD MMM YYYY` |
| D | Time | `paymentDate` | 10 | `HH:MM AM/PM` |
| E | Member Name | `member.fullName` or `walkInName` | 24 | Text |
| F | Member ID | `member.memberId` or `"Walk-in"` | 14 | Text |
| G | Payment Type | `paymentType` (formatted) | 18 | Text |
| H | Handled By | `staff.name` | 20 | Text |
| I | Amount (₱) | `amount` | 14 | `₱ #,##0.00` |

**Payment type display labels:**
```ts
const typeLabels = {
  daily_visit: 'Daily Visit',
  membership_fee: 'Membership Fee',
  monthly_plan: 'Monthly Plan',
}
```

### Header row styling

| Element | Style |
|---------|-------|
| Header row (row 6 after title block) | Font: Arial 10 bold · Color: `#000000` · Fill: `#C8FF00` (lime) · Center aligned · Row height: 20 |
| All header borders | Medium border · Color: `#999900` |

### Data row styling

| Element | Style |
|---------|-------|
| Odd rows | Fill: `#111111` · Font: Arial 10 · Color: `#FFFFFF` |
| Even rows | Fill: `#1A1A1A` · Font: Arial 10 · Color: `#FFFFFF` |
| Amount column (I) | Right aligned · Font bold · Color: `#C8FF00` |
| Member ID column (F) | Font: Courier New 10 · Color: `#AAAAAA` |
| "Walk-in" label in Member ID | Color: `#888888` · Italic |
| All cell borders | Thin · Color: `#2A2A2A` |
| Row height | 18 |

### Title block (rows 1–4, same as Summary sheet)

Repeat the same title block on the Transactions sheet:

```
Row 1: GymTrack — Payment Transactions
Row 2: {Range label} · {from date} – {to date}
Row 3: Exported by: {staff/owner name} · {export timestamp}
Row 4: [spacer]
Row 5: [spacer]
Row 6: [column headers]
Row 7+: data rows
```

### Totals row (after last data row)

```
Col A–H: "TOTAL"  ← merged, right aligned, bold, fill: #1A1A1A, lime text
Col I:   =SUM(I7:I{lastRow})  ← bold, lime, right aligned
```

Apply a thick top border on the totals row to visually separate it from data.

### Freeze panes

Freeze row 6 (header row) so column headers stay visible when scrolling:

```ts
sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 6 }]
```

### Auto filter

Apply Excel auto-filter on the header row so staff can sort/filter after opening:

```ts
sheet.autoFilter = {
  from: { row: 6, column: 1 },
  to: { row: 6, column: 9 },
}
```

---

## 6. Full ExcelJS Implementation

```ts
import ExcelJS from 'exceljs'

export async function generatePaymentExport(
  payments: Payment[],
  summary: PaymentSummary,
  exportedBy: string,
  rangeLabel: string,
  fromDate: Date,
  toDate: Date,
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'GymTrack'
  wb.created = new Date()

  // ─── Helpers ──────────────────────────────────────────
  const DARK       = '0A0A0A'
  const DARK2      = '111111'
  const DARK3      = '1A1A1A'
  const LIME       = 'C8FF00'
  const WHITE      = 'FFFFFF'
  const GRAY       = '888888'
  const BORDER_CLR = '2A2A2A'

  const darkFill = (shade = DARK2): ExcelJS.Fill =>
    ({ type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${shade}` } })

  const thinBorder = (): Partial<ExcelJS.Borders> => ({
    top:    { style: 'thin', color: { argb: `FF${BORDER_CLR}` } },
    bottom: { style: 'thin', color: { argb: `FF${BORDER_CLR}` } },
    left:   { style: 'thin', color: { argb: `FF${BORDER_CLR}` } },
    right:  { style: 'thin', color: { argb: `FF${BORDER_CLR}` } },
  })

  const applyTitleBlock = (sheet: ExcelJS.Worksheet, subtitle: string) => {
    sheet.mergeCells('A1:I1')
    const r1 = sheet.getCell('A1')
    r1.value = 'GymTrack'
    r1.font = { name: 'Arial', size: 18, bold: true, color: { argb: `FF${LIME}` } }
    r1.fill = darkFill(DARK)
    r1.alignment = { horizontal: 'center', vertical: 'middle' }
    sheet.getRow(1).height = 36

    sheet.mergeCells('A2:I2')
    const r2 = sheet.getCell('A2')
    r2.value = `Payment Report — ${rangeLabel}`
    r2.font = { name: 'Arial', size: 12, bold: true, color: { argb: `FF${WHITE}` } }
    r2.fill = darkFill(DARK)
    r2.alignment = { horizontal: 'center', vertical: 'middle' }
    sheet.getRow(2).height = 22

    sheet.mergeCells('A3:I3')
    const r3 = sheet.getCell('A3')
    r3.value = `Exported by: ${exportedBy}   ·   Period: ${fmt(fromDate)} – ${fmt(toDate)}   ·   Generated: ${fmt(new Date())}`
    r3.font = { name: 'Arial', size: 9, color: { argb: `FF${GRAY}` } }
    r3.fill = darkFill(DARK)
    r3.alignment = { horizontal: 'center', vertical: 'middle' }
    sheet.getRow(3).height = 16
  }

  const fmt = (d: Date) => d.toLocaleDateString('en-PH', {
    day: '2-digit', month: 'short', year: 'numeric'
  })

  // ─── SHEET 1: Summary ─────────────────────────────────
  const sum = wb.addWorksheet('Summary')

  sum.columns = [
    { width: 28 }, { width: 18 }, { width: 10 },
    { width: 10 }, { width: 10 }, { width: 10 },
  ]

  applyTitleBlock(sum, 'Summary')

  // row 4 spacer
  sum.getRow(4).height = 8
  sum.getRow(4).getCell(1).fill = darkFill(DARK)

  // Section: SUMMARY
  const addSectionHeader = (row: number, label: string) => {
    sum.mergeCells(`A${row}:F${row}`)
    const cell = sum.getCell(`A${row}`)
    cell.value = label
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: `FF${LIME}` } }
    cell.fill = darkFill(DARK3)
    cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
    cell.border = thinBorder()
    sum.getRow(row).height = 20
  }

  const addKpiRow = (row: number, label: string, value: string | number, format?: string) => {
    const rw = sum.getRow(row)
    rw.height = 20

    const lbl = rw.getCell(1)
    lbl.value = label
    lbl.font = { name: 'Arial', size: 10, color: { argb: `FFCCCCCC` } }
    lbl.fill = darkFill(DARK2)
    lbl.border = thinBorder()
    lbl.alignment = { indent: 2 }

    const val = rw.getCell(2)
    val.value = value
    val.font = { name: 'Arial', size: 10, bold: true, color: { argb: `FF${WHITE}` } }
    val.fill = darkFill(DARK2)
    val.border = thinBorder()
    val.alignment = { horizontal: 'right' }
    if (format) val.numFmt = format

    // fill remaining cols
    for (let c = 3; c <= 6; c++) {
      const cell = rw.getCell(c)
      cell.fill = darkFill(DARK2)
      cell.border = thinBorder()
    }
  }

  addSectionHeader(5, 'SUMMARY')
  addKpiRow(6, 'Total Revenue', summary.totalRevenue, '₱ #,##0.00')
  addKpiRow(7, 'Total Transactions', summary.totalTransactions)
  addKpiRow(8, 'Average per Day', summary.avgPerDay, '₱ #,##0.00')

  sum.getRow(9).height = 8

  addSectionHeader(10, 'REVENUE BY TYPE')

  // Daily visits row with % formula
  addKpiRow(11, 'Daily Visits', summary.byType.dailyVisits, '₱ #,##0.00')
  const pct11 = sum.getCell('C11')
  pct11.value = { formula: '=B11/B6' }
  pct11.numFmt = '0.0%'
  pct11.font = { name: 'Arial', size: 10, color: { argb: `FF${GRAY}` } }
  pct11.fill = darkFill(DARK2)
  pct11.border = thinBorder()
  pct11.alignment = { horizontal: 'right' }

  addKpiRow(12, 'Monthly Plans', summary.byType.monthlyPlans, '₱ #,##0.00')
  const pct12 = sum.getCell('C12')
  pct12.value = { formula: '=B12/B6' }
  pct12.numFmt = '0.0%'
  pct12.font = { name: 'Arial', size: 10, color: { argb: `FF${GRAY}` } }
  pct12.fill = darkFill(DARK2)
  pct12.border = thinBorder()
  pct12.alignment = { horizontal: 'right' }

  addKpiRow(13, 'Membership Fees', summary.byType.membershipFees, '₱ #,##0.00')
  const pct13 = sum.getCell('C13')
  pct13.value = { formula: '=B13/B6' }
  pct13.numFmt = '0.0%'
  pct13.font = { name: 'Arial', size: 10, color: { argb: `FF${GRAY}` } }
  pct13.fill = darkFill(DARK2)
  pct13.border = thinBorder()
  pct13.alignment = { horizontal: 'right' }

  sum.getRow(14).height = 8

  // Top staff section
  addSectionHeader(15, 'TOP STAFF BY TRANSACTIONS')
  summary.topStaff.forEach((staff, i) => {
    const row = 16 + i
    addKpiRow(row, staff.name, staff.transactionCount)
    const amtCell = sum.getCell(`C${row}`)
    amtCell.value = staff.totalAmount
    amtCell.numFmt = '₱ #,##0.00'
    amtCell.font = { name: 'Arial', size: 10, color: { argb: `FF${GRAY}` } }
    amtCell.fill = darkFill(DARK2)
    amtCell.border = thinBorder()
    amtCell.alignment = { horizontal: 'right' }
  })

  // ─── SHEET 2: Transactions ────────────────────────────
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

  applyTitleBlock(trx, 'Transactions')
  trx.getRow(4).height = 8
  trx.getRow(5).height = 8

  // Header row (row 6)
  const headers = ['#', 'Receipt No.', 'Date', 'Time', 'Member Name', 'Member ID', 'Payment Type', 'Handled By', 'Amount (₱)']
  const headerRow = trx.getRow(6)
  headerRow.height = 22
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1)
    cell.value = h
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF000000' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${LIME}` } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = {
      top:    { style: 'medium', color: { argb: 'FF999900' } },
      bottom: { style: 'medium', color: { argb: 'FF999900' } },
      left:   { style: 'thin',   color: { argb: 'FF999900' } },
      right:  { style: 'thin',   color: { argb: 'FF999900' } },
    }
  })

  const typeLabels: Record<string, string> = {
    daily_visit: 'Daily Visit',
    membership_fee: 'Membership Fee',
    monthly_plan: 'Monthly Plan',
  }

  // Data rows
  payments.forEach((p, i) => {
    const rowIndex = 7 + i
    const isOdd = i % 2 === 0
    const fillColor = isOdd ? DARK2 : DARK3
    const rw = trx.getRow(rowIndex)
    rw.height = 18

    const isWalkIn = !p.memberId
    const memberName = p.member?.fullName ?? p.walkInName ?? '—'
    const memberId = p.member?.memberId ?? null

    const values = [
      i + 1,
      p.receiptNumber,
      p.paymentDate,
      p.paymentDate,
      memberName,
      memberId,
      typeLabels[p.paymentType] ?? p.paymentType,
      p.staff?.name ?? '—',
      p.amount,
    ]

    values.forEach((v, ci) => {
      const cell = rw.getCell(ci + 1)
      cell.fill = darkFill(fillColor)
      cell.border = thinBorder()

      // Column-specific formatting
      if (ci === 2) {
        // Date column
        cell.value = v as Date
        cell.numFmt = 'DD MMM YYYY'
        cell.font = { name: 'Arial', size: 10, color: { argb: `FF${WHITE}` } }
        cell.alignment = { horizontal: 'center' }
      } else if (ci === 3) {
        // Time column
        cell.value = v as Date
        cell.numFmt = 'h:MM AM/PM'
        cell.font = { name: 'Arial', size: 10, color: { argb: `FF${WHITE}` } }
        cell.alignment = { horizontal: 'center' }
      } else if (ci === 5) {
        // Member ID
        if (isWalkIn) {
          cell.value = 'Walk-in'
          cell.font = { name: 'Courier New', size: 10, italic: true, color: { argb: `FF${GRAY}` } }
        } else {
          cell.value = v as string
          cell.font = { name: 'Courier New', size: 10, color: { argb: 'FFAAAAAA' } }
        }
        cell.alignment = { horizontal: 'center' }
      } else if (ci === 8) {
        // Amount
        cell.value = Number(v)
        cell.numFmt = '₱ #,##0.00'
        cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: `FF${LIME}` } }
        cell.alignment = { horizontal: 'right' }
      } else {
        cell.value = v as string | number
        cell.font = { name: 'Arial', size: 10, color: { argb: `FF${WHITE}` } }
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
  totalLabel.font = { name: 'Arial', size: 10, bold: true, color: { argb: `FF${LIME}` } }
  totalLabel.fill = darkFill(DARK3)
  totalLabel.alignment = { horizontal: 'right', vertical: 'middle', indent: 2 }
  totalLabel.border = {
    top: { style: 'medium', color: { argb: `FF${LIME}` } },
    ...thinBorder(),
  }

  const totalAmount = totalRow.getCell(9)
  totalAmount.value = { formula: `=SUM(I7:I${totalRowIndex - 1})` }
  totalAmount.numFmt = '₱ #,##0.00'
  totalAmount.font = { name: 'Arial', size: 11, bold: true, color: { argb: `FF${LIME}` } }
  totalAmount.fill = darkFill(DARK3)
  totalAmount.alignment = { horizontal: 'right', vertical: 'middle' }
  totalAmount.border = {
    top: { style: 'medium', color: { argb: `FF${LIME}` } },
    ...thinBorder(),
  }

  // Freeze header row
  trx.views = [{ state: 'frozen', xSplit: 0, ySplit: 6 }]

  // Auto filter on headers
  trx.autoFilter = {
    from: { row: 6, column: 1 },
    to:   { row: 6, column: 9 },
  }

  // ─── Write to buffer ───────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer()
  return buffer as Buffer
}
```

---

## 7. Summary Data Shape

Build the `summary` object before calling the generator. Compute it from the same payment records:

```ts
const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0)
const totalTransactions = payments.length

// Days in range
const dayDiff = Math.max(1, Math.ceil(
  (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)
))
const avgPerDay = totalRevenue / dayDiff

// By type
const byType = {
  dailyVisits:    payments.filter(p => p.paymentType === 'daily_visit').reduce((s, p) => s + Number(p.amount), 0),
  monthlyPlans:   payments.filter(p => p.paymentType === 'monthly_plan').reduce((s, p) => s + Number(p.amount), 0),
  membershipFees: payments.filter(p => p.paymentType === 'membership_fee').reduce((s, p) => s + Number(p.amount), 0),
}

// Top staff — group by staffId
const staffMap = new Map<number, { name: string, transactionCount: number, totalAmount: number }>()
payments.forEach(p => {
  const entry = staffMap.get(p.staffId) ?? { name: p.staff?.name ?? '—', transactionCount: 0, totalAmount: 0 }
  entry.transactionCount++
  entry.totalAmount += Number(p.amount)
  staffMap.set(p.staffId, entry)
})
const topStaff = Array.from(staffMap.values())
  .sort((a, b) => b.transactionCount - a.transactionCount)
  .slice(0, 5)

const summary: PaymentSummary = {
  totalRevenue,
  totalTransactions,
  avgPerDay,
  byType,
  topStaff,
}
```

---

## 8. Filename Convention

The downloaded file name must include the range and export date so staff can organize multiple exports:

```ts
// Examples:
GymTrack_Payments_Today_16-Jun-2026.xlsx
GymTrack_Payments_This-Week_16-Jun-2026.xlsx
GymTrack_Payments_This-Month_16-Jun-2026.xlsx
```

Frontend filename generation:
```ts
const rangeSlug = { today: 'Today', week: 'This-Week', month: 'This-Month' }[activeRange]
const dateSuffix = new Date().toLocaleDateString('en-PH', {
  day: '2-digit', month: 'short', year: 'numeric'
}).replace(/ /g, '-')
const filename = `GymTrack_Payments_${rangeSlug}_${dateSuffix}.xlsx`
```

---

## 9. Build Checklist

- [ ] `npm install exceljs`
- [ ] Create `src/lib/excel/payment-export.ts` — paste the `generatePaymentExport` function
- [ ] Create `GET /api/admin/payments/export/route.ts` — auth check, query, call generator, return buffer
- [ ] Create `GET /api/owner/payments/export/route.ts` — same pattern, owner auth
- [ ] Wire the export button `onClick` in `src/features/admin/payments/` — call the endpoint, trigger download
- [ ] Wire the export button `onClick` in `src/features/owner/payments/` — same pattern
- [ ] Test: export with 0 records (empty range), 1 record, and 50+ records
- [ ] Test: walk-in payments (no memberId) render correctly in the Member ID column
- [ ] Verify totals row formula resolves correctly when opened in Excel / Google Sheets
