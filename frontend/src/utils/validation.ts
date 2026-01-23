/**
 * Validation Utilities
 * Common validation functions for form inputs
 */

/**
 * Validate that a value is not empty
 */
export function validateRequired(value: string | undefined | null): boolean {
  return value !== undefined && value !== null && value.trim().length > 0;
}

/**
 * Validate string length
 */
export function validateLength(
  value: string | undefined | null,
  min: number,
  max?: number
): boolean {
  if (!value) return min === 0;
  const len = value.trim().length;
  if (max !== undefined) {
    return len >= min && len <= max;
  }
  return len >= min;
}

/**
 * Validate email format
 */
export function validateEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate phone number format
 */
export function validatePhoneNumber(phone: string | undefined | null): boolean {
  if (!phone) return false;
  // Accept various formats: (XXX) XXX-XXXX, XXX-XXX-XXXX, XXXXXXXXXX
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10;
}

/**
 * Validate postal code format (US ZIP)
 */
export function validatePostalCode(postalCode: string | undefined | null): boolean {
  if (!postalCode) return false;
  // Accept 5-digit or 9-digit ZIP codes
  const zipRegex = /^\d{5}(-\d{4})?$/;
  return zipRegex.test(postalCode.trim());
}
