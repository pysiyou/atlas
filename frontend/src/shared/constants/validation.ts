/**
 * Validation Constants
 * Shared validation rules and messages
 */

/**
 * Validation rules for form fields
 */
export const VALIDATION_RULES = {
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
  },
  PHONE: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 15,
  },
  EMAIL: {
    MAX_LENGTH: 255,
  },
  ADDRESS: {
    MAX_LENGTH: 500,
  },
  POSTAL_CODE: {
    MIN_LENGTH: 5,
    MAX_LENGTH: 10,
  },
  AGE: {
    MIN: 0,
    MAX: 150,
  },
} as const;

/**
 * Common validation error messages
 */
export const VALIDATION_MESSAGES = {
  // Generic messages
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PHONE: 'Please enter a valid phone number',
  INVALID_POSTAL_CODE: 'Please enter a valid postal code',
  INVALID_DATE: 'Please enter a valid date',
  MIN_LENGTH: (min: number) => `Must be at least ${min} characters`,
  MAX_LENGTH: (max: number) => `Must be no more than ${max} characters`,
  MIN_VALUE: (min: number) => `Must be at least ${min}`,
  MAX_VALUE: (max: number) => `Must be no more than ${max}`,
  
  // Specific field messages (from config/validation.ts)
  REQUIRED_FIELDS: {
    FULL_NAME: 'Full name is required',
    DATE_OF_BIRTH: 'Date of birth is required',
    PHONE: 'Phone number is required',
    STREET: 'Street address is required',
    CITY: 'City is required',
    POSTAL_CODE: 'Postal code is required',
    EMERGENCY_CONTACT_NAME: 'Emergency contact name is required',
    EMERGENCY_CONTACT_PHONE: 'Emergency contact phone is required',
  },
  INVALID_FIELDS: {
    EMAIL: 'Please enter a valid email address',
    PHONE: 'Please enter a valid phone number',
    POSTAL_CODE: 'Please enter a valid postal code',
    DATE_PAST: 'Date of birth must be in the past',
    DATE_OF_BIRTH: 'Please enter a valid date of birth',
  },
  LENGTH_ERRORS: {
    NAME: 'Name must be between 2 and 100 characters',
  },
} as const;

/**
 * Common validation patterns
 */
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[\d\s\-()]+$/,
  POSTAL_CODE: /^[A-Z0-9\s-]+$/i,
} as const;
