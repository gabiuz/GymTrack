# GymTrack — Admin Portal Backend Integration Spec

> **Scope:** Admin portal only (`/admin/*`)
> **Goal:** Replace all mocked/hardcoded data with real database connections, wire the QR scanner to the camera, and implement all missing API routes the admin UI depends on.
> **Stack context:** Next.js 16 App Router · Prisma 7 · PostgreSQL (Supabase) · jose JWT · bcryptjs · Zod · `html5-qrcode`

---

## 0. Prerequisites (Do These First)

These must be done before any admin feature will work.

---

## 0.0 Delete All Hardcoded Mock Data

Before connecting any real API, remove every hardcoded array and static fixture from the admin feature folder. Do not comment them out — delete them entirely so there is no risk of mock data silently falling back in.

### Files to clean — `src/features/admin/`

**`members/`**
- Delete the hardcoded `MEMBERS` array (list of fake member objects)
- Delete any `MEMBER_DETAIL` or single-member fixtures
- Replace with `useState<Member[]>([])` initialized as empty — real data comes from `GET /api/members`

**`memberships/`**
- Delete the hardcoded `ANNUAL_MEMBERSHIPS` and `MONTHLY_PLANS` arrays
- Replace with `useState<Membership[]>([])` and `useState<MonthlyPlan[]>([])` initialized as empty

**`payments/`**
- Delete the hardcoded `PAYMENTS` array
- Delete any hardcoded running totals or aggregated numbers
- Replace with `useState<Payment[]>([])` and `useState<number>(0)` for the total

**`attendance/`**
- Delete the hardcoded `ATTENDANCE_LOG` array
- Delete the hardcoded chart data array fed into Recharts
- Replace with `useState<Attendance[]>([])` and `useState<ChartEntry[]>([])`

**`scanner/`**
- Delete the simulated scan outcome logic (the hardcoded state machine cycling through `granted/denied/expired/unassigned/guest`)
- Delete any hardcoded member name, photo, or membership date shown in the result modal
- Replace with real API response data from `POST /api/admin/checkin`

### What to keep

Keep all UI components, modals, layout, styling, and filter/tab state. Only the **data** is being removed — the component structure stays intact. This makes connecting real API responses a drop-in replacement.

### Pattern to follow

Every admin page should follow this shape after cleanup:

```ts
// Before (mock)
const members = MEMBERS.filter(m => m.name.includes(search))

// After (real)
const [members, setMembers] = useState<Member[]>([])
const [loading, setLoading] = useState(true)

useEffect(() => {
  fetch(`/api/members?search=${search}`)
    .then(res => res.json())
    .then(data => setMembers(data.data))
    .finally(() => setLoading(false))
}, [search])
```

Add a loading state to every page — without it, the table will flash empty before data arrives.

---

### 0.1 Staff Login API

The admin login form exists but has no backend. Create the endpoint:

```
POST /api/auth/staff-login
```

**Logic:**
1. Accept `{ identifier, password }` — identifier can be username or email
2. Query: `User.findFirst` where `username === identifier OR email === identifier` AND `role === 'staff'` AND `isActive === true`
3. Compare password with `bcryptjs.compare`
4. On success: sign a JWT with payload `{ userId, name, role: 'staff' }` and set it as an httpOnly cookie named `gymtrack_admin_session` (7-day expiry)
5. On failure: return `401 Unauthorized`

**Zod schema:**
```ts
const StaffLoginSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
})
```

### 0.2 Protect All `/admin/*` Routes

Extend `src/proxy.ts` (and wire it in `middleware.ts` at `src/`) to guard admin routes:

```ts
// In proxy.ts — add alongside existing customer guard
if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
  const token = req.cookies.get('gymtrack_admin_session')?.value
  if (!token) return NextResponse.redirect(new URL('/admin/login', req.url))

  const payload = await verifyToken(token).catch(() => null)
  if (!payload || !['staff', 'owner'].includes(payload.role as string)) {
    const res = NextResponse.redirect(new URL('/admin/login', req.url))
    res.cookies.delete('gymtrack_admin_session')
    return res
  }
}
```

### 0.3 Auth Helper for API Routes

All admin API routes must verify the session. Create a reusable helper in `src/lib/auth.ts`:

```ts
export async function requireStaffSession(req: NextRequest) {
  const token = req.cookies.get('gymtrack_admin_session')?.value
  if (!token) return null
  return verifyToken(token).catch(() => null)
}
```

Use it at the top of every admin API route:
```ts
const session = await requireStaffSession(req)
if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
```

---

## 1. Scanner Page

**Current state:** Pure UI simulation. Scan outcomes are hardcoded. No camera access.

### 1.1 Real Camera Integration

Install the QR scanning library:
```bash
npm install html5-qrcode
```

Replace the simulated scanner component with a real camera feed. The scanner should:

1. On mount, request camera access via `html5-qrcode`
2. Continuously decode frames
3. On a successful decode, extract the `memberId` string (format: `MEM-000001`)
4. Call `POST /api/admin/checkin` with the scanned `memberId`
5. Show the result modal based on the API response

**QR Invalid Modal:**
- Show when the scanned QR cannot be decoded OR when the API returns `404` (member not found)
- Must match the existing dark/lime theme (`bg-gym-dark`, `text-gym-lime` accent)
- Include a dismiss button and an input field to search by Member ID manually (see 1.2)

### 1.2 Manual Member ID Search

The "search by Member ID" flow is an alternative to scanning. It must trigger the **same check-in flow** as a scan:

1. Staff types a Member ID (e.g. `MEM-000001`) into the search input
2. On submit, call `POST /api/admin/checkin` with that `memberId`
3. Show the same result modal as a scan

### 1.3 Check-In API

```
POST /api/admin/checkin
```

**Request body:**
```ts
{ memberId: string }  // e.g. "MEM-000001"
```

**Logic — evaluate member state and return the correct scenario:**

```
Step 1: Find member by memberId
  → If not found: return 404 { error: 'Member not found' }  ← triggers invalid QR modal

Step 2: Check for active MonthlyPlan (endDate >= today)
  → If found: SCENARIO C (active monthly plan)
    - Auto-record attendance (visitType: 'monthly_plan')
    - Return member name, plan endDate, status: 'monthly_active'

Step 3: Check if member has active annual Membership (endDate >= today)
  → If yes: SCENARIO B-MEMBER (daily visit, member rate)
    - Return member name, rate: 70, status: 'member_daily'
  → If expired: SCENARIO D (expired monthly plan / membership)
    - Return member name, status: 'expired', options: ['renew', 'daily_visit']

Step 4: No membership at all
  → SCENARIO A (unassigned)
    - Return member name, status: 'unassigned', options: ['register_membership', 'daily_visit']

Step 5: Walk-in (no memberId — guest enters manually)
  → SCENARIO B-GUEST
    - Return rate: 75, status: 'guest'
```

**Response shape:**
```ts
{
  status: 'monthly_active' | 'member_daily' | 'guest' | 'expired' | 'unassigned',
  member?: { id, memberId, fullName, photoUrl },
  rate?: number,            // 70 or 75
  planEndDate?: string,     // ISO date string
  membershipEndDate?: string,
}
```

**Payment + Attendance recording:**

For `monthly_active`: attendance is recorded automatically — no payment needed.

For all `daily` scenarios (member or guest): staff must confirm "Paid" before attendance is recorded. Add a second endpoint:

```
POST /api/admin/checkin/confirm
```
```ts
{
  memberId?: string,     // null for walk-ins
  walkInName?: string,   // required if no memberId
  visitType: 'daily' | 'monthly_plan',
  amount: number,        // 70 or 75
}
```

This endpoint creates both a `Payment` record and an `Attendance` record in a single transaction, with `staffId` from the session token.

---

## 2. Members Page

**Current state:** Renders a hardcoded `MEMBERS` array. Search filters it locally. Add/Edit modals don't call any API.

### 2.1 Load Real Members

Replace the hardcoded array. On page load, fetch:

```
GET /api/members?page=1&limit=20&search=
```

The endpoint already exists and is paginated. Wire the existing search input to update the `?search=` param and re-fetch.

**Display per member row:**
- Photo (from `photoUrl` — Cloudinary URL)
- Full name
- Member ID
- Contact number
- Gender
- Active membership status (derived: check if latest `Membership.endDate >= today`)
- Active monthly plan status (derived: check if latest `MonthlyPlan.endDate >= today`)
- Actions: View QR · Edit · Manage Membership

### 2.2 View QR Modal

When "View QR" is clicked:
- Fetch `GET /api/members/:id` to get the full member record
- Display `member.qrCode` as an `<img>` tag — it is currently stored as a base64 data URI
- Provide a download button (`<a href={qrCode} download="MEM-000001.png">`)
- Modal must match the dark/lime theme

### 2.3 Edit Member

The edit modal form already exists. Wire the submit button to:

```
PATCH /api/members/:id
```

Create this endpoint. Accept partial updates to:
- `fullName`
- `contactNumber`
- `address`
- `gender`
- `dateOfBirth`
- `emergencyContact`
- `photoUrl`

**Zod schema:**
```ts
const EditMemberSchema = z.object({
  fullName: z.string().min(1).optional(),
  contactNumber: z.string().regex(/^09\d{9}$/).optional(),
  address: z.string().min(1).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  dateOfBirth: z.string().datetime().optional().nullable(),
  emergencyContact: z.string().optional().nullable(),
  photoUrl: z.string().url().optional().nullable(),
})
```

On `contactNumber` change: check uniqueness against other members (exclude self).
On success: return the updated member record.

### 2.4 Add Member

The add member modal form already exists. Wire the submit button to the existing:

```
POST /api/members
```

No changes needed to the API. Just connect the form.

---

## 3. Membership Page

**Current state:** Annual and monthly tabs render mocked data with correct status colour-coding but no DB connection.

### 3.1 Load Real Membership Data

Create two new endpoints:

```
GET /api/admin/memberships?type=annual&page=1&limit=20&search=
GET /api/admin/memberships?type=monthly&page=1&limit=20&search=
```

**Annual tab** — query `Membership` joined with `Member`:
```ts
// Derive status at query time — do NOT rely on a stored status field
const isActive = membership.endDate >= new Date()
```

Return per row: member name, member ID, start date, end date, derived status.

**Monthly tab** — query `MonthlyPlan` joined with `Member`. Same derived status logic.

### 3.2 Renew Annual Membership

Add a "Renew" button per row in the annual tab. On click, open a confirmation modal then call:

```
POST /api/admin/memberships/renew
```
```ts
{ memberId: number }  // Member.id (not memberId string)
```

**Logic:**
1. Find the member's latest `Membership` record
2. If it exists: new `startDate = max(today, existing endDate)`, new `endDate = startDate + 1 year`
3. If none exists: `startDate = today`, `endDate = today + 1 year`
4. Create a new `Membership` record (do not update the old one — keep history)
5. Create a `Payment` record: `paymentType: 'membership_fee'`, `amount: 200`, `staffId` from session

**Rule: If the membership is currently active (endDate >= today), the renew button should be disabled.** Staff cannot deactivate an active membership.

### 3.3 Avail / Renew Monthly Plan

Add an "Avail Plan" or "Renew" button in the monthly tab. On click, open a modal with:
- Duration selector: 1 month / 3 months / 6 months / 12 months
- Amount input (pre-filled with gym's configured rate, editable by staff)
- Confirm button

On submit, call:

```
POST /api/admin/monthly-plans
```
```ts
{
  memberId: number,
  duration: 1 | 3 | 6 | 12,
  amount: number,
}
```

**Logic:**
1. Member does NOT need an active annual membership to avail a monthly plan (per spec)
2. `startDate = today`
3. `endDate = today + duration months`
4. Create a new `MonthlyPlan` record
5. Create a `Payment` record: `paymentType: 'monthly_plan'`, `amount`, `staffId` from session

---

## 4. Payments Page

**Current state:** Filter chips (Today / This Week / This Month) and a running total work but filter a hardcoded local array.

### 4.1 Load Real Payments

```
GET /api/admin/payments?range=today|week|month&page=1&limit=50
```

**Date filter logic (server-side):**
```ts
const now = new Date()

const ranges = {
  today: {
    gte: startOfDay(now),
    lte: endOfDay(now),
  },
  week: {
    gte: startOfWeek(now),   // Monday
    lte: endOfDay(now),
  },
  month: {
    gte: startOfMonth(now),
    lte: endOfDay(now),
  },
}

// Filter: Payment.paymentDate within range
```

**Return per payment record:**
- Receipt number
- Member name (or `walkInName` for guests)
- Member ID
- Payment type (Daily Visit / Membership Fee / Monthly Plan)
- Amount
- Date + time
- Staff name (from `staffId → User.name`)

**Also return:** total amount for the selected range (use `_sum: { amount: true }` in Prisma aggregate).

### 4.2 Record Manual Payment (Walk-in)

The payment recording form in the scanner flow handles this via `POST /api/admin/checkin/confirm` (see Section 1.3). No separate payment form is needed on the Payments page — it is read-only.

---

## 5. Attendance Page

**Current state:** Recharts bar chart and check-in log render hardcoded data. Range filter buttons (Today / Last 3 Days / Last 7 Days / Last 30 Days) are wired to local state only.

### 5.1 Load Real Attendance

```
GET /api/admin/attendance?range=today|3d|7d|30d&page=1&limit=50
```

**Date filter logic (server-side):**
```ts
const rangeDays = { today: 0, '3d': 3, '7d': 7, '30d': 30 }
const daysBack = rangeDays[range]
const since = new Date()
since.setDate(since.getDate() - daysBack)
since.setHours(0, 0, 0, 0)

// Filter: Attendance.checkInTime >= since
```

**Return per attendance record:**
- Member name (or `walkInName` for guests)
- Member ID (or "Walk-in" label)
- Check-in time (full timestamp)
- Visit type (Daily / Monthly Plan)
- Staff name who recorded it

### 5.2 Bar Chart Data

The Recharts bar chart needs aggregated data by day. Add a separate query in the same endpoint (or a dedicated endpoint):

```
GET /api/admin/attendance/chart?range=7d|30d
```

Return an array grouped by day:
```ts
[
  { date: '2026-06-10', count: 12 },
  { date: '2026-06-11', count: 8 },
  // ...
]
```

Use this SQL pattern via Prisma raw or `groupBy`:
```ts
await prisma.attendance.groupBy({
  by: ['checkInTime'],  // will need date truncation — use $queryRaw for DATE()
  _count: true,
  where: { checkInTime: { gte: since } },
  orderBy: { checkInTime: 'asc' },
})
```

Or with raw SQL for cleaner date grouping:
```ts
await prisma.$queryRaw`
  SELECT DATE("checkInTime") as date, COUNT(*) as count
  FROM "Attendance"
  WHERE "checkInTime" >= ${since}
  GROUP BY DATE("checkInTime")
  ORDER BY date ASC
`
```

---

## 6. API Route Summary

All routes below require the `gymtrack_admin_session` cookie (staff or owner role).

| Method | Route | Purpose |
|--------|-------|---------|
| `POST` | `/api/auth/staff-login` | Staff login → set admin session cookie |
| `GET` | `/api/members` | List members (already exists — add auth check) |
| `POST` | `/api/members` | Register new member (already exists — add auth check) |
| `PATCH` | `/api/members/:id` | Edit member info |
| `POST` | `/api/admin/checkin` | Evaluate QR scan / member ID → return scenario |
| `POST` | `/api/admin/checkin/confirm` | Confirm payment → record Payment + Attendance |
| `GET` | `/api/admin/memberships` | List annual memberships (`?type=annual\|monthly`) |
| `POST` | `/api/admin/memberships/renew` | Renew annual membership |
| `POST` | `/api/admin/monthly-plans` | Avail or renew monthly plan |
| `GET` | `/api/admin/payments` | List payments with date range filter |
| `GET` | `/api/admin/attendance` | List attendance with date range filter |
| `GET` | `/api/admin/attendance/chart` | Aggregated daily counts for bar chart |

---

## 7. Theme Reference

All modals and new UI components must follow the existing design system:

| Token | Value | Usage |
|-------|-------|-------|
| `bg-gym-dark` / `#0a0a0a` | Dark background | Modal backgrounds, cards |
| `text-gym-lime` / `#c8ff00` | Lime accent | Headings, active states, CTAs |
| `font-space` | Space Grotesk | Headings, numbers, labels |
| `font-inter` | Inter | Body text, descriptions |
| Borders | `border-white/10` | Subtle separators |
| Danger | `text-red-400` / `bg-red-400/10` | Error states, denied access |
| Success | `text-green-400` / `bg-green-400/10` | Granted access, active status |

**Invalid QR modal example structure:**
```
┌─────────────────────────────┐
│  ✕  (close button)          │  ← bg-gym-dark, border-white/10
│                             │
│  ⚠  QR Code Invalid         │  ← text-red-400, font-space
│  Cannot identify member.    │  ← text-white/60, font-inter
│                             │
│  [ Search by Member ID ]    │  ← input, border-white/20
│  [ Search ──────────── ]    │  ← bg-gym-lime text-black button
└─────────────────────────────┘
```

---

## 8. Build Order

Follow this sequence to avoid building on top of incomplete dependencies:

```
0. Delete all hardcoded mock data (Section 0.0)  ← do this before touching any API
1. POST /api/auth/staff-login                    ← nothing else works without this
2. Extend proxy.ts to guard /admin/*             ← security baseline
3. PATCH /api/members/:id                        ← completes the Members page
4. Connect GET /api/members to UI                ← replaces mocked member list
5. Real camera in Scanner                        ← core staff workflow
6. POST /api/admin/checkin                       ← scanner logic
7. POST /api/admin/checkin/confirm               ← payment + attendance recording
8. GET /api/admin/memberships                    ← membership page data
9. POST /api/admin/memberships/renew             ← renew annual
10. POST /api/admin/monthly-plans                ← avail monthly plan
11. GET /api/admin/payments                      ← payments page data
12. GET /api/admin/attendance                    ← attendance list
13. GET /api/admin/attendance/chart              ← bar chart data
```
