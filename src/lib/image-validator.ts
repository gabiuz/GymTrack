/**
 * image-validator.ts
 *
 * OOP  — Encapsulates all image-validation logic in one class.
 *        Internal rules are private; callers interact only through the
 *        public `validate` method (Encapsulation).
 *
 * SOLID:
 *  S — Single Responsibility: this class only validates images.
 *      It does NOT upload, transform, or respond to HTTP.
 *
 *  O — Open/Closed: to add a new rule (e.g. minimum dimensions),
 *      extend this class or add a method — no existing code changes.
 *
 *  I — Interface Segregation: `ValidationResult` is a narrow contract.
 *      Callers only need { valid, error } — nothing more.
 */

/** Narrow result contract — callers only depend on what they use (ISP). */
export interface ValidationResult {
  valid: boolean
  /** Present only when valid === false. */
  error?: string
}

export class ImageValidator {
  /** Encapsulation: rules are private; callers cannot mutate them. */
  private readonly allowedTypes: ReadonlySet<string>
  private readonly maxSizeBytes: number

  /**
   * DIP (Dependency Inversion): configuration is injected, not hard-coded.
   * Swap allowed types or size limit without touching this class.
   */
  constructor(allowedTypes: readonly string[], maxSizeBytes: number) {
    this.allowedTypes = new Set(allowedTypes)
    this.maxSizeBytes = maxSizeBytes
  }

  /**
   * SRP — each private method validates exactly one rule.
   * OCP — adding a new rule = adding a new method, not modifying existing ones.
   */
  private validateType(mimeType: string): ValidationResult {
    if (!this.allowedTypes.has(mimeType)) {
      const allowed = [...this.allowedTypes].join(', ')
      return {
        valid: false,
        error: `File type "${mimeType}" is not allowed. Accepted: ${allowed}`,
      }
    }
    return { valid: true }
  }

  private validateSize(sizeBytes: number): ValidationResult {
    if (sizeBytes > this.maxSizeBytes) {
      const maxMB = this.maxSizeBytes / (1024 * 1024)
      return { valid: false, error: `Image must be smaller than ${maxMB} MB` }
    }
    return { valid: true }
  }

  /**
   * Template Method pattern — runs all validation rules in sequence.
   * Returns the first failure or { valid: true } if all pass.
   *
   * Callers depend only on this one public method (Encapsulation / ISP).
   */
  validate(file: File): ValidationResult {
    const typeCheck = this.validateType(file.type)
    if (!typeCheck.valid) return typeCheck

    const sizeCheck = this.validateSize(file.size)
    if (!sizeCheck.valid) return sizeCheck

    return { valid: true }
  }
}
