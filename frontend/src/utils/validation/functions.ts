/**
 * Validation Functions
 * Common validation functions for form inputs.
 */

export function validateRequired(value: string | undefined | null): boolean {
  return value !== undefined && value !== null && value.trim().length > 0;
}

export function validateLength(
  value: string | undefined | null,
  min: number,
  max?: number
): boolean {
  if (!value) return min === 0;
  const len = value.trim().length;
  return max !== undefined ? len >= min && len <= max : len >= min;
}

export function validateEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validatePhoneNumber(phone: string | undefined | null): boolean {
  if (!phone) return false;
  return phone.replace(/\D/g, '').length === 10;
}

export function validatePostalCode(postalCode: string | undefined | null): boolean {
  if (!postalCode) return false;
  return /^\d{5}(-\d{4})?$/.test(postalCode.trim());
}
