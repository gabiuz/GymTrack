/**
 * route.ts — POST /api/upload
 *
 * OOP  — Depends on class instances (ImageValidator, IImageUploader),
 *        not on bare functions or SDK calls directly (Abstraction).
 *
 * SOLID:
 *  S — Single Responsibility: this module only handles the HTTP
 *      request/response lifecycle. Validation and uploading are
 *      delegated to dedicated classes.
 *
 *  O — Open/Closed: change the allowed types, size limit, or upload
 *      provider by editing the constructor args or the factory —
 *      this handler never needs to change.
 *
 *  D — Dependency Inversion: the handler depends on `IImageUploader`
 *      (abstraction) and `ImageValidator` (injectable config), not on
 *      Cloudinary SDK details directly.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createImageUploader } from '@/lib/cloudinary'
import { ImageValidator } from '@/lib/image-validator'

// ─── Module-level validator (OCP / DIP) ──────────────────────────────────────
/**
 * ImageValidator is constructed with injected config.
 * To tighten or relax rules, change the arguments here only —
 * the ImageValidator class itself stays closed for modification (OCP).
 */
const validator = new ImageValidator(
  ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'], // allowed MIME types
  10 * 1024 * 1024 // 10 MB limit
)

// ─── IP Rate Limiter (In-Memory) ─────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const RATE_LIMIT_MAX = 5 // 5 requests per window

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false
  }

  record.count += 1
  return true
}

// ─── POST /api/upload ────────────────────────────────────────────────────────
// Accepts multipart/form-data with a "file" field,
// uploads to Cloudinary, returns { url }
export async function POST(req: NextRequest) {
  try {
    // 1. IP Rate Limiting
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Too many requests, please try again later.' }, { status: 429 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // DIP — handler depends on the ImageValidator abstraction, not inline logic.
    // Swap validation rules without touching this handler (OCP).
    const validation = validator.validate(file)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // DIP — depends on IImageUploader, not CloudinaryImageUploader directly.
    // LSP — swap to S3ImageUploader and this line still works unchanged.
    const uploader = createImageUploader()
    const url = await uploader.upload(buffer)

    return NextResponse.json({ url })
  } catch (error) {
    console.error('[POST /api/upload]', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
