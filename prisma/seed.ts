/**
 * prisma/seed.ts
 *
 * Run with: npx tsx prisma/seed.ts
 *
 * Inserts:
 *  - 1 owner user
 *  - 3 staff users
 *  - 30 members (each with a linked user account)
 *  - Memberships, monthly plans, payments, and attendance records
 *    spread across today, the last 7 days, last 30 days, and last year.
 */

<<<<<<< HEAD
import { PrismaClient } from '../src/generated/prisma'
=======
import { PrismaClient, Prisma } from '../src/generated/prisma'
>>>>>>> origin/dev
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'
dotenv.config()

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// ── Helpers ────────────────────────────────────────────────────────────────────

function daysAgo(n: number, hourOffset = 9): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(hourOffset, Math.floor(Math.random() * 59), 0, 0)
  return d
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// ── Data ───────────────────────────────────────────────────────────────────────

const FIRST_NAMES = [
  'Juan', 'Maria', 'Jose', 'Ana', 'Pedro', 'Rosa', 'Carlos', 'Elena',
  'Luis', 'Sofia', 'Miguel', 'Isabel', 'Ramon', 'Carla', 'Diego', 'Luz',
  'Marco', 'Tina', 'Felix', 'Grace', 'Rico', 'Donna', 'Lito', 'Vina',
  'Noel', 'Abby', 'Dante', 'Lea', 'Nico', 'Mae',
]

const LAST_NAMES = [
  'Santos', 'Reyes', 'Cruz', 'Bautista', 'Ocampo', 'Garcia', 'Ramos',
  'Torres', 'Castillo', 'Flores', 'Mendoza', 'Dela Cruz', 'Villanueva',
  'Aquino', 'Navarro', 'Pascual', 'Lim', 'Tan', 'Go', 'Sy',
]

const ADDRESSES = [
  'Brgy. 1, Manila', 'Brgy. 5, Quezon City', 'Brgy. San Jose, Marikina',
  'Brgy. Poblacion, Makati', 'Brgy. Bagumbayan, Taguig',
  'Brgy. Sto. Nino, Paranaque', 'Brgy. Malabon, Caloocan',
  'Brgy. Balara, Quezon City', 'Brgy. Malate, Manila',
]

const GENDERS = ['male', 'female', 'other'] as const

async function main() {
<<<<<<< HEAD
  console.log('🌱  Starting seed…')
=======
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Seed cannot be run in production')
  }

  console.log('🔄 Starting seed...')

  console.log('🧹  Cleaning up database...')
  await prisma.attendance.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.monthlyPlan.deleteMany()
  await prisma.membership.deleteMany()
  await prisma.member.deleteMany()
  await prisma.user.deleteMany({ where: { role: 'customer' } })
>>>>>>> origin/dev

  const passwordHash = await bcrypt.hash('password123', 10)

  // ── 1. Owner ───────────────────────────────────────────────────────────────
  const owner = await prisma.user.upsert({
    where: { username: 'owner' },
    update: {},
    create: {
      role: 'owner',
      name: 'Gabrielle Uzumaki',
      username: 'owner',
      email: 'owner@gymtrack.app',
      password: passwordHash,
      isActive: true,
    },
  })
  console.log(`✅  Owner: ${owner.name}`)

  // ── 2. Staff ───────────────────────────────────────────────────────────────
  const staffData = [
    { name: 'Rico Navarro',   username: 'rico',   email: 'rico@gymtrack.app' },
    { name: 'Donna Castillo', username: 'donna',  email: 'donna@gymtrack.app' },
    { name: 'Felix Torres',   username: 'felix',  email: 'felix@gymtrack.app' },
  ]

  const staffUsers = await Promise.all(
    staffData.map((s) =>
      prisma.user.upsert({
        where: { username: s.username },
        update: {},
        create: { role: 'staff', name: s.name, username: s.username, email: s.email, password: passwordHash, isActive: true },
      })
    )
  )
  console.log(`✅  Staff: ${staffUsers.map((s) => s.name).join(', ')}`)

  const allStaff = [owner, ...staffUsers]

  // ── 3. Members ─────────────────────────────────────────────────────────────
  const members: Awaited<ReturnType<typeof prisma.member.create>>[] = []

  for (let i = 0; i < 30; i++) {
    const firstName = FIRST_NAMES[i]
    const lastName  = randomPick(LAST_NAMES)
    const fullName  = `${firstName} ${lastName}`
    const memberId  = `MEM-${String(i + 1).padStart(6, '0')}`
    const gender    = randomPick([...GENDERS])

    // Create a linked user account for the member
    const memberUser = await prisma.user.upsert({
      where: { username: memberId.toLowerCase() },
      update: {},
      create: {
        role: 'customer',
        name: fullName,
        username: memberId.toLowerCase(),
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase().replace(' ', '')}.${i}@mail.com`,
        password: passwordHash,
        isActive: true,
      },
    })

    const dob = new Date(1985 + randomInt(0, 20), randomInt(0, 11), randomInt(1, 28))

    const member = await prisma.member.upsert({
      where: { memberId },
      update: {},
      create: {
        memberId,
        userId: memberUser.id,
        fullName,
        contactNumber: `09${randomInt(100000000, 999999999)}`,
        address: randomPick(ADDRESSES),
        gender,
        dateOfBirth: dob,
        emergencyContact: `09${randomInt(100000000, 999999999)}`,
      },
    })
    members.push(member)
  }
  console.log(`✅  Members: ${members.length} created`)

  // ── 4. Memberships ─────────────────────────────────────────────────────────
  for (const member of members) {
<<<<<<< HEAD
=======
    // Generate 1-4 past expired memberships
    for (let i = 1; i <= randomInt(1, 4); i++) {
      const pastStart = daysAgo(365 * i + randomInt(0, 30))
      const pastEnd = new Date(pastStart)
      pastEnd.setFullYear(pastEnd.getFullYear() + 1)
      await prisma.membership.create({
        data: { memberId: member.id, startDate: pastStart, endDate: pastEnd },
      })
    }

    // Current/recent membership
>>>>>>> origin/dev
    const startDate = daysAgo(randomInt(30, 365))
    const endDate   = new Date(startDate)
    endDate.setFullYear(endDate.getFullYear() + 1)

<<<<<<< HEAD
=======
    // ~20% chance this recent one is already expired (e.g., started 400 days ago)
    if (Math.random() < 0.2) {
      startDate.setDate(startDate.getDate() - 365)
      endDate.setFullYear(endDate.getFullYear() - 1)
    }

>>>>>>> origin/dev
    await prisma.membership.create({
      data: { memberId: member.id, startDate, endDate },
    })
  }
<<<<<<< HEAD
  console.log(`✅  Memberships: ${members.length} created`)
=======
  console.log(`✅  Memberships: history and current created`)
>>>>>>> origin/dev

  // ── 5. Monthly Plans ───────────────────────────────────────────────────────
  const DURATIONS = [1, 3, 6, 12]
  const AMOUNTS   = { 1: 500, 3: 1350, 6: 2400, 12: 4200 }

  for (const member of members.slice(0, 20)) { // 20 out of 30 have a plan
<<<<<<< HEAD
=======
    // Generate 2-6 past expired monthly plans
    for (let i = 1; i <= randomInt(2, 6); i++) {
      const pastStart = daysAgo(30 * i + randomInt(0, 5))
      const pastEnd = new Date(pastStart)
      pastEnd.setMonth(pastEnd.getMonth() + 1)
      await prisma.monthlyPlan.create({
        data: { memberId: member.id, duration: 1, amount: 500, startDate: pastStart, endDate: pastEnd },
      })
    }

    // Current/recent plan
>>>>>>> origin/dev
    const duration  = randomPick(DURATIONS)
    const startDate = daysAgo(randomInt(0, 60))
    const endDate   = new Date(startDate)
    endDate.setMonth(endDate.getMonth() + duration)

<<<<<<< HEAD
=======
    // ~30% chance the "current" one is actually expired
    if (Math.random() < 0.3) {
      startDate.setDate(startDate.getDate() - 60)
      endDate.setMonth(endDate.getMonth() - 2)
    }

>>>>>>> origin/dev
    await prisma.monthlyPlan.create({
      data: {
        memberId:  member.id,
        duration,
        amount:    AMOUNTS[duration as keyof typeof AMOUNTS],
        startDate,
        endDate,
      },
    })
  }
<<<<<<< HEAD
  console.log('✅  Monthly plans created')
=======
  console.log('✅  Monthly plans history and current created')
>>>>>>> origin/dev

  // ── 6. Payments ────────────────────────────────────────────────────────────
  const paymentRows: Parameters<typeof prisma.payment.create>[0]['data'][] = []

  // Membership fees
  for (const member of members) {
    paymentRows.push({
      memberId:    member.id,
      staffId:     randomPick(allStaff).id,
      paymentType: 'membership_fee',
      amount:      200,
      paymentDate: daysAgo(randomInt(30, 365)),
    })
  }

  // Monthly plan payments
  for (const member of members.slice(0, 20)) {
    const duration = randomPick(DURATIONS)
    paymentRows.push({
      memberId:    member.id,
      staffId:     randomPick(allStaff).id,
      paymentType: 'monthly_plan',
      amount:      AMOUNTS[duration as keyof typeof AMOUNTS],
      paymentDate: daysAgo(randomInt(0, 60)),
    })
  }

  // Daily visits — spread across 365 days
  for (let d = 0; d < 200; d++) {
    paymentRows.push({
      memberId:    randomPick(members).id,
      staffId:     randomPick(allStaff).id,
      paymentType: 'daily_visit',
      amount:      50,
      paymentDate: daysAgo(randomInt(0, 365)),
    })
  }

  // Walk-in (no member)
  const walkInNames = ['Tomas Cruz', 'Bea Santos', 'Ray Gomez', 'Nina Reyes', 'Leo Tan']
  for (const name of walkInNames) {
    paymentRows.push({
      walkInName:  name,
      staffId:     randomPick(allStaff).id,
      paymentType: 'daily_visit',
      amount:      50,
      paymentDate: daysAgo(randomInt(0, 30)),
    })
  }

  await prisma.payment.createMany({ data: paymentRows as never })
  console.log(`✅  Payments: ${paymentRows.length} created`)

  // ── 7. Attendance ──────────────────────────────────────────────────────────
<<<<<<< HEAD
  const attendanceRows: NonNullable<Parameters<typeof prisma.attendance.createMany>[0]>['data'] = []
=======
  const attendanceRows: Prisma.AttendanceCreateManyInput[] = []
>>>>>>> origin/dev

  // TODAY — all 30 members check in today
  for (const member of members) {
    attendanceRows.push({
      memberId:    member.id,
      staffId:     randomPick(allStaff).id,
      checkInTime: daysAgo(0, randomInt(6, 12)),
      visitType:   randomPick(['daily', 'monthly_plan']),
    })
  }

  // LAST 7 DAYS — 5-15 members per day
  for (let d = 1; d <= 7; d++) {
    const count = randomInt(5, 15)
    const dayMembers = [...members].sort(() => Math.random() - 0.5).slice(0, count)
    for (const member of dayMembers) {
      attendanceRows.push({
        memberId:    member.id,
        staffId:     randomPick(allStaff).id,
        checkInTime: daysAgo(d, randomInt(6, 20)),
        visitType:   randomPick(['daily', 'monthly_plan']),
      })
    }
  }

  // LAST 30 DAYS — 3-10 members per day
  for (let d = 8; d <= 30; d++) {
    const count = randomInt(3, 10)
    const dayMembers = [...members].sort(() => Math.random() - 0.5).slice(0, count)
    for (const member of dayMembers) {
      attendanceRows.push({
        memberId:    member.id,
        staffId:     randomPick(allStaff).id,
        checkInTime: daysAgo(d, randomInt(6, 20)),
        visitType:   randomPick(['daily', 'monthly_plan']),
      })
    }
  }

  // LAST YEAR — 2-8 members per day
  for (let d = 31; d <= 365; d++) {
    const count = randomInt(2, 8)
    const dayMembers = [...members].sort(() => Math.random() - 0.5).slice(0, count)
    for (const member of dayMembers) {
      attendanceRows.push({
        memberId:    member.id,
        staffId:     randomPick(allStaff).id,
        checkInTime: daysAgo(d, randomInt(6, 20)),
        visitType:   randomPick(['daily', 'monthly_plan']),
      })
    }
  }

  // Walk-in attendance
  for (const name of walkInNames) {
    for (let d = 0; d < randomInt(3, 8); d++) {
      attendanceRows.push({
        walkInName:  name,
        staffId:     randomPick(allStaff).id,
        checkInTime: daysAgo(randomInt(0, 60), randomInt(7, 19)),
        visitType:   'daily',
      })
    }
  }

  await prisma.attendance.createMany({ data: attendanceRows as never })
  console.log(`✅  Attendance: ${attendanceRows.length} records created`)

  console.log('\n🎉  Seed complete!')
  console.log('\n🔑  Login credentials (all passwords: password123)')
  console.log('   Owner  → username: owner')
  console.log('   Staff  → username: rico / donna / felix')
  console.log('   Member → username: mem-000001 … mem-000030')
}

main()
  .catch((e) => { console.error('❌  Seed failed:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect(); await pool.end() })
