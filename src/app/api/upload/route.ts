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

// ─── POST /api/upload ────────────────────────────────────────────────────────
// Accepts multipart/form-data with a "file" field,
// uploads to Cloudinary, returns { url }
export async function POST(req: NextRequest) {
  try {
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
