/**
 * Validation Configuration - Single Source of Truth
 * Validation rules and messages centralized
 */

// ============================================
// VALIDATION RULES
// ============================================

export const VALIDATION_RULES = {
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
  },
  PHONE: {
    MIN_DIGITS: 10,
    MAX_DIGITS: 15,
  },
  POSTAL_CODE: {
    MIN_LENGTH: 5,
    MAX_LENGTH: 10,
  },
  AGE: {
    MIN: 0,
    MAX: 150,
  },
  PASSWORD: {
    MIN_LENGTH: 6,
  },
  VOLUME: {
    MARGINAL_THRESHOLD: 0.8, // 80% of required volume
  },
} as const;

// ============================================
// VALIDATION MESSAGES
// ============================================

export const VALIDATION_MESSAGES = {
  // Required field messages
  REQUIRED: {
    GENERIC: (field: string) => `${field} is required`,
    FULL_NAME: 'Full name is required',
    DATE_OF_BIRTH: 'Date of birth is required',
    PHONE: 'Phone number is required',
    STREET: 'Street address is required',
    CITY: 'City is required',
    POSTAL_CODE: 'Postal code is required',
    EMERGENCY_CONTACT_NAME: 'Emergency contact name is required',
    EMERGENCY_CONTACT_PHONE: 'Emergency contact phone is required',
    USERNAME: 'Username is required',
    PASSWORD: 'Password is required',
    CONTAINER_COLOR: 'Please select the container color',
    CONTAINER_TYPE: 'Please select the container type',
  },

  // Format validation messages
  INVALID: {
    EMAIL: 'Please enter a valid email address',
    PHONE: 'Please enter a valid phone number',
    POSTAL_CODE: 'Please enter a valid postal code',
    DATE_OF_BIRTH: 'Please enter a valid date of birth',
    DATE_PAST: 'Date must be in the past',
    DATE_FUTURE: 'Date must be in the future',
    CREDENTIALS: 'Invalid credentials. Please try again.',
  },

  // Length validation messages
  LENGTH: {
    NAME: `Name must be between ${VALIDATION_RULES.NAME.MIN_LENGTH} and ${VALIDATION_RULES.NAME.MAX_LENGTH} characters`,
    TOO_SHORT: (field: string, min: number) => `${field} must be at least ${min} characters`,
    TOO_LONG: (field: string, max: number) => `${field} must be no more than ${max} characters`,
  },

  // Volume validation messages
  VOLUME: {
    INSUFFICIENT: (required: number) => `Volume must be at least ${required} mL`,
    MARGINAL: 'Volume is marginal. Some tests may need prioritization.',
    SUFFICIENT: 'Volume is sufficient for all tests',
    RECOLLECTION: 'Insufficient volume. Recollection recommended.',
  },

  // Generic messages
  GENERIC: {
    REQUIRED_FIELDS: 'Please fill in all required fields',
    SUBMISSION_ERROR: 'An error occurred. Please try again.',
  },
} as const;
