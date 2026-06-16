# GymTrack — Owner Portal Backend Integration Spec

> **Scope:** Owner portal only (`/owner/*`)
> **Goal:** Delete all hardcoded mock data, connect all shared pages to the database, implement the four dashboard tabs, and wire the Staff & Users management page.
> **Stack context:** Next.js 16 App Router · Prisma 7 · PostgreSQL (Supabase) · jose JWT · bcryptjs · Zod · Recharts · `html5-qrcode`

---

## 0. Delete All Hardcoded Mock Data

Do this before touching any API. Remove every hardcoded array and static fixture from `src/features/owner/`. Do not comment them out — delete them entirely.

### Files to clean — `src/features/owner/`

**`scanner/`**
- Delete the simulated scan state machine (hardcoded `granted/denied/expired/unassigned/guest` cycling)
- Delete any hardcoded member name, photo, or plan date shown in the result modal
- Replace with real API response from `POST /api/owner/checkin`

**`members/`**
- Delete the hardcoded `MEMBERS` array
- Replace with `useState<Member[]>([])` — data comes from `GET /api/members`

**`memberships/`**
- Delete hardcoded `ANNUAL_MEMBERSHIPS` and `MONTHLY_PLANS` arrays
- Replace with `useState<Membership[]>([])` and `useState<MonthlyPlan[]>([])`

**`payments/`**
- Delete the hardcoded `PAYMENTS` array and any hardcoded totals
- Replace with `useState<Payment[]>([])` and `useState<number>(0)` for the total

**`attendance/`**
- Delete the hardcoded `ATTENDANCE_LOG` array
- Delete the hardcoded chart data arrays fed into Recharts
- Replace with `useState<Attendance[]>([])` and `useState<ChartEntry[]>([])`

**`dashboard/`**
- Delete all hardcoded KPI values (visitor counts, revenue totals, member stats)
- Delete all hardcoded chart data arrays (revenue by day, attendance by hour, membership growth)
- Delete the hardcoded "Needs attention" counts (expiring soon, expired, unassigned)
- Replace all with empty state initialized to `0`, `[]`, or `null` — real data comes from dashboard API routes

**`staff-users/`**
- Delete the hardcoded `STAFF_USERS` array
- Delete any local state toggling for enable/disable that doesn't persist
- Replace with `useState<StaffUser[]>([])` — data comes from `GET /api/owner/staff`

### Loading states

Every page that fetches data must show a loading state while the request is in flight. Without it, tables and charts will flash empty before data arrives. Add `useState<boolean>(true)` for `isLoading` on every page and render a skeleton or spinner while true.

---

## 1. Owner Login

**Current state:** Login form exists, no backend.

### 1.1 Owner Login API

```
POST /api/auth/owner-login
```

**Logic:**
1. Accept `{ identifier, password }` — identifier can be username or email
2. Query: `User.findFirst` where `(username === identifier OR email === identifier)` AND `role === 'owner'` AND `isActive === true`
3. Compare password with `bcryptjs.compare`
4. On success: sign JWT with payload `{ userId, name, role: 'owner' }`, set as httpOnly cookie named `gymtrack_owner_session` (7-day expiry)
5. On failure: return `401 Unauthorized`

**Zod schema:**
```ts
const OwnerLoginSchema = z.object({
  identifier: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
})
```

### 1.2 Protect All `/owner/*` Routes

Extend `src/proxy.ts` to guard owner routes:

```ts
if (pathname.startsWith('/owner') && !pathname.startsWith('/owner/login')) {
  const token = req.cookies.get('gymtrack_owner_session')?.value
  if (!token) return NextResponse.redirect(new URL('/owner/login', req.url))

  const payload = await verifyToken(token).catch(() => null)
  if (!payload || payload.role !== 'owner') {
    const res = NextResponse.redirect(new URL('/owner/login', req.url))
    res.cookies.delete('gymtrack_owner_session')
    return res
  }
}
```

### 1.3 Auth Helper for Owner API Routes

Add to `src/lib/auth.ts`:

```ts
export async function requireOwnerSession(req: NextRequest) {
  const token = req.cookies.get('gymtrack_owner_session')?.value
  if (!token) return null
  return verifyToken(token).catch(() => null)
}
```

Use at the top of every owner API route:
```ts
const session = await requireOwnerSession(req)
if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
if (session.role !== 'owner') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
```

---

## 2. Scanner Page

**Current state:** UI simulation only. No camera. Outcomes are hardcoded.

The owner scanner is identical in behaviour to the admin scanner. Implement the exact same logic — same check-in flow, same result modals, same manual search fallback. The only difference is the session cookie used for auth (`gymtrack_owner_session` instead of `gymtrack_admin_session`) and the API prefix (`/api/owner/checkin` instead of `/api/admin/checkin`).

### 2.1 Real Camera Integration

Install if not already present:
```bash
npm install html5-qrcode
```

Replace the simulated scanner with a real camera feed using `html5-qrcode`. On a successful decode:
1. Extract the `memberId` string (format: `MEM-000001`)
2. Call `POST /api/owner/checkin` with the scanned `memberId`
3. Show the result modal based on the API response

**Invalid QR modal:** Show when the QR cannot be decoded or the API returns `404`. Match the dark/lime theme. Include a dismiss button and the manual Member ID search input (see 2.2).

### 2.2 Manual Member ID Search — Prefilled Input

The search input must always show `MEM-` as a non-deletable prefix. The owner types only the numeric portion after it. Implement this in the input component:

```tsx
const [suffix, setSuffix] = useState('')
const memberId = `MEM-${suffix}`

// Max digits: 6 (MEM-000001 format = 6 digit suffix)
<input
  value={suffix}
  maxLength={6}
  placeholder="000001"
  onChange={(e) => {
    // Only allow digits
    const digits = e.target.value.replace(/\D/g, '')
    setSuffix(digits)
  }}
/>
// Display the prefix visually as a non-editable label beside the input:
// [ MEM- ] [ 000001 ]
```

On submit, call `POST /api/owner/checkin` with `memberId` = `MEM-${suffix}`. This same prefilled input behaviour must also be applied to the **admin scanner** (see note at end of this section).

### 2.3 Check-In API

```
POST /api/owner/checkin
```

Identical logic to `POST /api/admin/checkin`. Evaluate member state and return the correct scenario:

```
Step 1: Find member by memberId
  → Not found: return 404 { error: 'Member not found' }

Step 2: Check for active MonthlyPlan (endDate >= today)
  → Found: SCENARIO C — auto-record attendance (visitType: 'monthly_plan')
    Return: { status: 'monthly_active', member, planEndDate }

Step 3: Check for active annual Membership (endDate >= today)
  → Found: SCENARIO B-MEMBER
    Return: { status: 'member_daily', member, rate: 70 }
  → Expired: SCENARIO D
    Return: { status: 'expired', member }

Step 4: No membership
  → SCENARIO A: { status: 'unassigned', member }

Step 5: No memberId (walk-in guest)
  → SCENARIO B-GUEST: { status: 'guest', rate: 75 }
```

### 2.4 Confirm Payment + Record Attendance

```
POST /api/owner/checkin/confirm
```

```ts
{
  memberId?: string,
  walkInName?: string,
  visitType: 'daily' | 'monthly_plan',
  amount: number,
}
```

Creates a `Payment` record and an `Attendance` record in a single Prisma transaction. Sets `staffId` from the owner session token.

---

> **Note — Admin Scanner Update Required**
> Apply the same prefilled `MEM-` input behaviour to `src/features/admin/scanner/`. The input box must always show `MEM-` as a non-deletable prefix. Max suffix length: 6 digits. Digits only.

---

## 3. Members Page

**Current state:** Hardcoded `MEMBERS` array. Search is local. Add/Edit modals don't call any API.

Implementation is identical to the admin Members page. Wire the same endpoints:

| Action | Endpoint |
|--------|----------|
| Load members | `GET /api/members?page=1&limit=20&search=` |
| Add member | `POST /api/members` |
| Edit member | `PATCH /api/members/:id` |
| View QR | `GET /api/members/:id` → display `member.qrCode` |

**Display per row:** Photo · Full name · Member ID · Contact number · Gender · Membership status (derived) · Monthly plan status (derived) · Actions (View QR · Edit · Manage Membership)

**QR modal:** Display `member.qrCode` as `<img>`. Provide a download button:
```tsx
<a href={member.qrCode} download={`${member.memberId}.png`}>
  Download QR
</a>
```

**Edit member endpoint** (create if not yet built):
```
PATCH /api/members/:id
```
Accepts partial updates: `fullName`, `contactNumber`, `address`, `gender`, `dateOfBirth`, `emergencyContact`, `photoUrl`. Check `contactNumber` uniqueness against other members (exclude self).

---

## 4. Membership Page

**Current state:** Annual and monthly tabs show mocked data with colour-coded status.

Implementation is identical to the admin Membership page. Wire the same endpoints:

| Action | Endpoint |
|--------|----------|
| Load annual memberships | `GET /api/owner/memberships?type=annual` |
| Load monthly plans | `GET /api/owner/memberships?type=monthly` |
| Renew annual membership | `POST /api/owner/memberships/renew` |
| Avail/renew monthly plan | `POST /api/owner/monthly-plans` |

**Membership status** is derived at query time — do not rely on a stored status field:
```ts
const isActive = membership.endDate >= new Date()
```

**Rules:**
- If annual membership is currently active (`endDate >= today`), the Renew button must be disabled. Owner cannot deactivate an active membership.
- Members can avail a monthly plan without an active annual membership.

---

## 5. Payments Page

**Current state:** Filter chips and running total work against hardcoded data.

Implementation is identical to the admin Payments page:

```
GET /api/owner/payments?range=today|week|month&page=1&limit=50
```

Return per record: receipt number · member name (or `walkInName`) · member ID · payment type · amount · date+time · staff name.

Also return the total amount for the selected range using Prisma aggregate:
```ts
_sum: { amount: true }
```

Filter logic:
```ts
const ranges = {
  today: { gte: startOfDay(now), lte: endOfDay(now) },
  week:  { gte: startOfWeek(now), lte: endOfDay(now) },
  month: { gte: startOfMonth(now), lte: endOfDay(now) },
}
```

---

## 6. Attendance Page

**Current state:** Recharts bar chart and check-in log use hardcoded data. Range filters are local state only.

Implementation is identical to the admin Attendance page:

```
GET /api/owner/attendance?range=today|3d|7d|30d&page=1&limit=50
GET /api/owner/attendance/chart?range=7d|30d
```

**List** returns per record: member name (or `walkInName`) · member ID · check-in time · visit type · staff name.

**Chart** returns daily aggregated counts:
```ts
[
  { date: '2026-06-10', count: 12 },
  { date: '2026-06-11', count: 8 },
]
```

Use raw SQL for clean date grouping:
```ts
await prisma.$queryRaw`
  SELECT DATE("checkInTime") as date, COUNT(*)::int as count
  FROM "Attendance"
  WHERE "checkInTime" >= ${since}
  GROUP BY DATE("checkInTime")
  ORDER BY date ASC
`
```

---

## 7. Dashboard Page

**Current state:** Four tabs (Overview / Revenue / Attendance / Membership) render fully mocked KPI cards and Recharts charts. Period toggles (Today/Week/Month etc.) switch between hardcoded states.

This is the owner-exclusive page. All four tabs need dedicated API endpoints.

---

### 7.1 Overview Tab

**Period options:** Today · Week · Month

```
GET /api/owner/dashboard/overview?range=today|week|month
```

**Response shape:**
```ts
{
  todayVisitors: number,       // Attendance count for today regardless of range
  todayRevenue: number,        // Payment total for today regardless of range
  activeMembers: number,       // Members with Membership.endDate >= today
  activePlans: number,         // Members with MonthlyPlan.endDate >= today
  expiringIn7Days: number,     // MonthlyPlans expiring within 7 days
  newThisMonth: number,        // Members created this calendar month
  needsAttention: {
    expiringSoon: number,      // MonthlyPlans expiring within 7 days (same as above)
    expired: number,           // Members with most recent Membership expired and no active plan
    unassigned: number,        // Members with no Membership record at all
  },
  revenueChart: Array<{        // Last 7 days always
    date: string,              // 'YYYY-MM-DD'
    amount: number,
  }>,
}
```

**Prisma queries:**

```ts
const now = new Date()
const startOfToday = new Date(now.setHours(0,0,0,0))
const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

// Today's visitors
const todayVisitors = await prisma.attendance.count({
  where: { checkInTime: { gte: startOfToday } }
})

// Today's revenue
const todayRevenue = await prisma.payment.aggregate({
  where: { paymentDate: { gte: startOfToday } },
  _sum: { amount: true }
})

// Active members (has at least one Membership with endDate in the future)
const activeMembers = await prisma.membership.count({
  where: { endDate: { gte: now } },
  distinct: ['memberId'],
})

// Active monthly plans
const activePlans = await prisma.monthlyPlan.count({
  where: { endDate: { gte: now } },
})

// Expiring within 7 days
const expiringIn7Days = await prisma.monthlyPlan.count({
  where: {
    endDate: { gte: now, lte: in7Days }
  }
})

// New this month
const newThisMonth = await prisma.member.count({
  where: { createdAt: { gte: startOfMonth } }
})

// Needs attention — unassigned (no membership record ever)
const unassigned = await prisma.member.count({
  where: { memberships: { none: {} } }
})

// Revenue chart — last 7 days grouped by date
const revenueChart = await prisma.$queryRaw`
  SELECT DATE("paymentDate") as date, SUM(amount)::float as amount
  FROM "Payment"
  WHERE "paymentDate" >= ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)}
  GROUP BY DATE("paymentDate")
  ORDER BY date ASC
`
```

---

### 7.2 Revenue Tab

**Period options:** Week · Month · Year

```
GET /api/owner/dashboard/revenue?range=week|month|year
```

**Response shape:**
```ts
{
  totalRevenue: number,
  avgPerDay: number,
  totalTransactions: number,
  byType: {
    monthlyPlans: number,
    dailyVisits: number,
    membershipFees: number,
  },
  chart: Array<{
    label: string,    // Month name e.g. 'Jan', 'Feb' for year view; date for week/month
    amount: number,
  }>,
}
```

**Date ranges:**
```ts
const ranges = {
  week:  { gte: subDays(now, 7) },
  month: { gte: subDays(now, 30) },
  year:  { gte: subMonths(now, 6) },  // chart shows last 6 months
}
```

**Revenue by type** using Prisma `groupBy`:
```ts
const byType = await prisma.payment.groupBy({
  by: ['paymentType'],
  where: { paymentDate: { gte: rangeStart } },
  _sum: { amount: true },
})
// Map to { monthlyPlans, dailyVisits, membershipFees }
```

**Chart — last 6 months grouped by month:**
```ts
const chart = await prisma.$queryRaw`
  SELECT TO_CHAR("paymentDate", 'Mon') as label,
         SUM(amount)::float as amount
  FROM "Payment"
  WHERE "paymentDate" >= ${subMonths(now, 6)}
  GROUP BY TO_CHAR("paymentDate", 'Mon'), DATE_TRUNC('month', "paymentDate")
  ORDER BY DATE_TRUNC('month', "paymentDate") ASC
`
```

**`avgPerDay`** = `totalRevenue / number of days in range`

---

### 7.3 Attendance Tab

**Period options:** Week · Month

```
GET /api/owner/dashboard/attendance?range=week|month
```

**Response shape:**
```ts
{
  totalCheckIns: number,
  avgPerDay: number,
  busiestDay: string,       // e.g. 'Monday'
  peakHour: string,         // e.g. '7:00 AM – 8:00 AM'
  byDayOfWeek: Array<{
    day: string,            // 'Mon', 'Tue', ... 'Sun'
    count: number,
  }>,
  byHour: Array<{
    hour: string,           // '6 AM', '7 AM', ...
    count: number,
  }>,
  visitMix: {
    monthlyPlan: number,    // percentage
    dailyMember: number,    // percentage
    dailyGuest: number,     // percentage
  },
}
```

**Queries:**

```ts
// By day of week
const byDayOfWeek = await prisma.$queryRaw`
  SELECT TO_CHAR("checkInTime", 'Dy') as day,
         COUNT(*)::int as count
  FROM "Attendance"
  WHERE "checkInTime" >= ${rangeStart}
  GROUP BY TO_CHAR("checkInTime", 'Dy'), EXTRACT(DOW FROM "checkInTime")
  ORDER BY EXTRACT(DOW FROM "checkInTime") ASC
`

// By hour
const byHour = await prisma.$queryRaw`
  SELECT EXTRACT(HOUR FROM "checkInTime")::int as hour,
         COUNT(*)::int as count
  FROM "Attendance"
  WHERE "checkInTime" >= ${rangeStart}
  GROUP BY EXTRACT(HOUR FROM "checkInTime")
  ORDER BY hour ASC
`

// Visit mix
const visitMix = await prisma.attendance.groupBy({
  by: ['visitType'],
  where: { checkInTime: { gte: rangeStart } },
  _count: true,
})
// Compute percentages from totals
// visitType: 'monthly_plan' → monthlyPlan %
// visitType: 'daily' + memberId != null → dailyMember %
// visitType: 'daily' + memberId == null → dailyGuest %
```

**Busiest day** = the day name from `byDayOfWeek` with the highest count.
**Peak hour** = the hour from `byHour` with the highest count, formatted as `'7:00 AM – 8:00 AM'`.

---

### 7.4 Membership Tab

**Period:** Fixed (always shows current state + last 6 months growth)

```
GET /api/owner/dashboard/memberships
```

**Response shape:**
```ts
{
  activeMembers: number,
  newThisMonth: number,
  expiredLast30Days: number,
  renewalRate: number,          // percentage: renewals / (renewals + expired) * 100
  memberGrowthChart: Array<{
    month: string,              // 'Jan', 'Feb', ...
    count: number,              // cumulative or new members that month
  }>,
  activePlansByType: {
    oneMonth: number,
    threeMonths: number,
    sixMonths: number,
    dailyVisitOnly: number,     // active members with no active monthly plan
  },
}
```

**Queries:**

```ts
// Expired in last 30 days
const expiredLast30Days = await prisma.membership.count({
  where: {
    endDate: {
      gte: subDays(now, 30),
      lt: now,
    }
  }
})

// Renewal rate
const renewals = await prisma.payment.count({
  where: {
    paymentType: 'membership_fee',
    paymentDate: { gte: subDays(now, 30) }
  }
})
const renewalRate = expiredLast30Days > 0
  ? Math.round((renewals / (renewals + expiredLast30Days)) * 100)
  : 100

// Member growth — new members per month for last 6 months
const memberGrowth = await prisma.$queryRaw`
  SELECT TO_CHAR("createdAt", 'Mon') as month,
         COUNT(*)::int as count
  FROM "Member"
  WHERE "createdAt" >= ${subMonths(now, 6)}
  GROUP BY TO_CHAR("createdAt", 'Mon'), DATE_TRUNC('month', "createdAt")
  ORDER BY DATE_TRUNC('month', "createdAt") ASC
`

// Active plans by duration
const activePlans = await prisma.monthlyPlan.groupBy({
  by: ['duration'],
  where: { endDate: { gte: now } },
  _count: true,
})
// duration: 1 → oneMonth, 3 → threeMonths, 6 → sixMonths

// Daily visit only — active members with no active monthly plan
const dailyVisitOnly = await prisma.member.count({
  where: {
    memberships: { some: { endDate: { gte: now } } },      // has active membership
    monthlyPlans: { none: { endDate: { gte: now } } },     // no active monthly plan
  }
})
```

---

## 8. Staff & Users Page

**Current state:** Hardcoded `STAFF_USERS` array. Add/Edit/Disable modals update local state only — nothing persists.

### 8.1 Load Staff Users

```
GET /api/owner/staff
```

Return all users where `role = 'owner' OR role = 'staff'`, ordered by `createdAt DESC`.

**Response per user:**
```ts
{
  id: number,
  name: string,
  username: string | null,
  email: string | null,
  role: 'owner' | 'staff',
  isActive: boolean,
  lastActive: string | null,   // ISO timestamp of their most recent Payment or Attendance record
  createdAt: string,
}
```

**`lastActive`** is derived — find the most recent `Payment.paymentDate` or `Attendance.checkInTime` where `staffId = user.id`, whichever is later:

```ts
const lastPayment = await prisma.payment.findFirst({
  where: { staffId: user.id },
  orderBy: { paymentDate: 'desc' },
  select: { paymentDate: true }
})
const lastAttendance = await prisma.attendance.findFirst({
  where: { staffId: user.id },
  orderBy: { checkInTime: 'desc' },
  select: { checkInTime: true }
})
const lastActive = [lastPayment?.paymentDate, lastAttendance?.checkInTime]
  .filter(Boolean)
  .sort((a, b) => b - a)[0] ?? null
```

### 8.2 Add Staff User

```
POST /api/owner/staff
```

**Request body:**
```ts
{
  name: string,
  username: string,
  email?: string,
  role: 'staff' | 'owner',
  password: string,
}
```

**Zod schema:**
```ts
const CreateStaffSchema = z.object({
  name: z.string().min(1),
  username: z.string().min(3).max(30),
  email: z.string().email().optional(),
  role: z.enum(['staff', 'owner']),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})
```

**Logic:**
1. Check `username` uniqueness: if taken, return `409 Conflict`
2. Check `email` uniqueness if provided
3. Hash password with `bcryptjs` (10 rounds)
4. Create `User` record with `isActive: true`
5. Return the created user (exclude password)

### 8.3 Edit Staff User

```
PATCH /api/owner/staff/:id
```

**Request body** (all optional):
```ts
{
  name?: string,
  username?: string,
  role?: 'staff' | 'owner',
}
```

**Rules:**
- Owner cannot edit their own role (prevent accidental self-demotion)
- Check `username` uniqueness against other users (exclude self)
- Password is NOT editable here — add a separate reset endpoint if needed

**Guard:**
```ts
if (String(targetUser.id) === String(session.userId) && body.role && body.role !== 'owner') {
  return NextResponse.json(
    { error: 'You cannot change your own role' },
    { status: 400 }
  )
}
```

### 8.4 Enable / Disable Staff Access

```
PATCH /api/owner/staff/:id/toggle
```

Toggles `isActive` on the target user:
```ts
const updated = await prisma.user.update({
  where: { id: targetId },
  data: { isActive: !currentUser.isActive }
})
```

**Rules:**
- Owner cannot disable their own account
- Disabled staff (`isActive: false`) are rejected at login — already handled by the login check in Section 1.1

**Guard:**
```ts
if (targetId === session.userId) {
  return NextResponse.json(
    { error: 'You cannot disable your own account' },
    { status: 400 }
  )
}
```

---

## 9. API Route Summary

All routes require the `gymtrack_owner_session` cookie with `role === 'owner'`.

| Method | Route | Purpose |
|--------|-------|---------|
| `POST` | `/api/auth/owner-login` | Owner login → set owner session cookie |
| `POST` | `/api/owner/checkin` | Evaluate QR scan / member ID → return scenario |
| `POST` | `/api/owner/checkin/confirm` | Confirm payment → record Payment + Attendance |
| `GET` | `/api/members` | List members (shared — add owner session as accepted auth) |
| `POST` | `/api/members` | Register new member (shared) |
| `PATCH` | `/api/members/:id` | Edit member (shared) |
| `GET` | `/api/owner/memberships` | List memberships (`?type=annual\|monthly`) |
| `POST` | `/api/owner/memberships/renew` | Renew annual membership |
| `POST` | `/api/owner/monthly-plans` | Avail or renew monthly plan |
| `GET` | `/api/owner/payments` | List payments with date range filter |
| `GET` | `/api/owner/attendance` | List attendance with date range filter |
| `GET` | `/api/owner/attendance/chart` | Daily aggregated counts for bar chart |
| `GET` | `/api/owner/dashboard/overview` | Overview KPIs + 7-day revenue chart |
| `GET` | `/api/owner/dashboard/revenue` | Revenue KPIs + 6-month chart |
| `GET` | `/api/owner/dashboard/attendance` | Attendance KPIs + by-hour + by-day charts |
| `GET` | `/api/owner/dashboard/memberships` | Membership KPIs + growth chart |
| `GET` | `/api/owner/staff` | List all staff and owner accounts |
| `POST` | `/api/owner/staff` | Create new staff/owner account |
| `PATCH` | `/api/owner/staff/:id` | Edit staff name, username, or role |
| `PATCH` | `/api/owner/staff/:id/toggle` | Enable or disable staff access |

---

## 10. Shared API Note

The owner and admin portals share some underlying data (`/api/members`, `/api/upload`). For shared routes, update the auth check to accept **both** session cookies:

```ts
// src/app/api/members/route.ts
const adminToken = req.cookies.get('gymtrack_admin_session')?.value
const ownerToken = req.cookies.get('gymtrack_owner_session')?.value
const token = ownerToken ?? adminToken

if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
const session = await verifyToken(token).catch(() => null)
if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
```

Do not duplicate route logic — one endpoint, two accepted cookies.

---

## 11. Build Order

Follow this sequence. Each step depends on the one before it.

```
0.  Delete all hardcoded mock data (Section 0)       ← do this first
1.  POST /api/auth/owner-login                        ← nothing else works without this
2.  Extend proxy.ts to guard /owner/*                 ← security baseline
3.  Real camera + prefilled MEM- input in scanner     ← applies to both owner and admin scanner
4.  POST /api/owner/checkin                           ← core workflow
5.  POST /api/owner/checkin/confirm                   ← payment + attendance recording
6.  Connect GET /api/members to owner members UI      ← replaces mocked list
7.  PATCH /api/members/:id                            ← edit member (if not built for admin yet)
8.  GET /api/owner/memberships                        ← membership page data
9.  POST /api/owner/memberships/renew                 ← renew annual
10. POST /api/owner/monthly-plans                     ← avail monthly plan
11. GET /api/owner/payments                           ← payments page
12. GET /api/owner/attendance + /chart                ← attendance page + chart
13. GET /api/owner/dashboard/overview                 ← first dashboard tab
14. GET /api/owner/dashboard/revenue                  ← second dashboard tab
15. GET /api/owner/dashboard/attendance               ← third dashboard tab
16. GET /api/owner/dashboard/memberships              ← fourth dashboard tab
17. GET /api/owner/staff                              ← staff list
18. POST /api/owner/staff                             ← add staff
19. PATCH /api/owner/staff/:id                        ← edit staff
20. PATCH /api/owner/staff/:id/toggle                 ← enable/disable staff
```
