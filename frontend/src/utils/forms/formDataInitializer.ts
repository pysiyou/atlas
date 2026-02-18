/**
 * Form Data Initialization Utilities
 * Generic utilities for initializing form data from existing entities
 */

/**
 * Create initial form data from an existing entity
 * Handles optional entity and provides default values
 * @param entity - Existing entity or undefined
 * @param defaults - Default values to use when entity is undefined
 * @returns Form data object
 */
export function createInitialFormData<T extends Record<string, unknown>>(
  entity: T | undefined,
  defaults: T
): T {
  if (!entity) {
    return { ...defaults };
  }

  // Merge entity with defaults to ensure all fields are present
  return { ...defaults, ...entity };
}

/**
 * Normalize form field value
 * Converts various input types to consistent form values
 * @param value - Value to normalize
 * @returns Normalized value
 */
export function normalizeFormValue(value: unknown): string | number | boolean | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  // Convert arrays to comma-separated strings
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(', ');
  }

  // Convert objects to JSON strings (for complex fields)
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}
