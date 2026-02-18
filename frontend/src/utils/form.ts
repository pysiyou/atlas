/**
 * Form Data Initialization Utilities
 */

export function createInitialFormData<T extends Record<string, unknown>>(
  entity: T | undefined,
  defaults: T
): T {
  if (!entity) {
    return { ...defaults };
  }
  return { ...defaults, ...entity };
}

export function normalizeFormValue(value: unknown): string | number | boolean | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(', ');
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}
