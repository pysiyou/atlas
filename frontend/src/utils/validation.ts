/**
 * Validation Utilities
 */

/**
 * Validate phone number format
 * Accepts common formats like: (123) 456-7890, 123-456-7890, +1 123 456 7890, 1234567890
 * Enforces 10–15 digits and guards against obviously fake numbers (e.g. all zeros).
 */
export const validatePhoneNumber = (phone: string): boolean => {
  // Allow digits, spaces, basic punctuation and leading +
  const phoneRegex = /^[\d\s\-\(\)\+]+$/;
  const digits = phone.replace(/\D/g, '');

  if (!phoneRegex.test(phone)) return false;
  if (digits.length < 10 || digits.length > 15) return false;

  // Reject numbers composed of a single repeated digit (000..., 111..., etc.)
  if (/^(\d)\1+$/.test(digits)) return false;

  return true;
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate date is in the past (including today)
 */
export const validatePastDate = (date: string | Date): boolean => {
  const selectedDate = new Date(date);
  const today = new Date();

  // Normalise to midnight for comparison so "today" counts as valid
  const selectedDay = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDate.getDate()
  );
  const todayDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  return selectedDay <= todayDay;
};

/**
 * Validate age is reasonable (0–150 years), taking month/day into account
 */
export const validateAge = (dateOfBirth: string | Date): boolean => {
  const dob = new Date(dateOfBirth);
  const today = new Date();

  let age = today.getFullYear() - dob.getFullYear();

  const hasNotHadBirthdayThisYear =
    today.getMonth() < dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate());

  if (hasNotHadBirthdayThisYear) {
    age -= 1;
  }

  return age >= 0 && age <= 150;
};

/**
 * Validate numeric result is within plausible range
 */
export const validateNumericResult = (value: number, min: number = 0, max: number = 10000): boolean => {
  return !isNaN(value) && value >= min && value <= max;
};

/**
 * Validate required field is not empty
 */
export const validateRequired = (value: string | number | null | undefined): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
};

/**
 * Validate string length
 */
export const validateLength = (value: string, min: number, max?: number): boolean => {
  const length = value.trim().length;
  if (length < min) return false;
  if (max && length > max) return false;
  return true;
};

/**
 * Validate postal code (basic validation)
 */
export const validatePostalCode = (postalCode: string): boolean => {
  const cleaned = postalCode.replace(/\s/g, '');
  return cleaned.length >= 5 && cleaned.length <= 10;
};
