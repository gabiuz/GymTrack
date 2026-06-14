/**
 * cloudinary.ts
 *
 * OOP  — Wraps the Cloudinary SDK in a concrete class.
 *        The class owns its own config and hides internal conversion
 *        details behind a private method (Encapsulation, Abstraction).
 *
 * SOLID:
 *  S — Single Responsibility: `CloudinaryImageUploader` only uploads images.
 *      Configuration, validation, and HTTP handling live elsewhere.
 *
 *  O — Open/Closed: closed for modification. To add S3 support, write
 *      `S3ImageUploader implements IImageUploader` — no changes here.
 *
 *  L — Liskov Substitution: any `IImageUploader` can replace
 *      `CloudinaryImageUploader` without breaking callers.
 *
 *  I — Interface Segregation: `IImageUploader` is intentionally narrow.
 *      Callers only depend on `upload()` — nothing else.
 *
 *  D — Dependency Inversion: callers depend on the `IImageUploader`
 *      abstraction, not on the concrete Cloudinary class.
 */

import { v2 as cloudinary } from 'cloudinary'

// ─── Abstraction / ISP ───────────────────────────────────────────────────────
/**
 * Narrow interface (ISP): only expose what callers need.
 * Swap Cloudinary → S3 → any CDN by creating a new implementation.
 */
export interface IImageUploader {
  upload(source: string | Buffer): Promise<string>
}

// ─── Concrete Implementation (OCP, LSP, Encapsulation) ─────────────────────
export class CloudinaryImageUploader implements IImageUploader {
  constructor() {
    /**
     * DIP — reads config from the environment (injected externally),
     * never hard-coded inside the class body.
     */
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    })
  }

  /**
   * Encapsulation — Buffer-to-data-URI conversion is a private detail.
   * Callers never need to know this format exists.
   */
  private toDataUri(buffer: Buffer): string {
    return `data:image/jpeg;base64,${buffer.toString('base64')}`
  }

  /** Implements IImageUploader.upload — satisfies LSP. */
  async upload(source: string | Buffer): Promise<string> {
    const input = Buffer.isBuffer(source) ? this.toDataUri(source) : source

    const result = await cloudinary.uploader.upload(input, {
      folder: 'gymtrack/members',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    })

    return result.secure_url
  }
}

// ─── Factory Function (DIP / Factory Pattern) ────────────────────────────────
/**
 * Factory hides the concrete class from callers (DIP).
 * To swap implementations, change this function only — callers are untouched.
 */
export function createImageUploader(): IImageUploader {
  return new CloudinaryImageUploader()
}
