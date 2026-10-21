import type { FieldErrors } from 'react-hook-form';
import type { PatientFormInput } from './schemas/patientFormSchemas';

const GENERAL_PREFIXES = [
  'fullName',
  'dateOfBirth',
  'gender',
  'phone',
  'email',
  'height',
  'weight',
  'address',
  'emergencyContact',
] as const;

export type PatientFormTabId = 'general' | 'medical' | 'vitals' | 'affiliation';

/** Map a react-hook-form field path to the patient form tab that owns it. */
export function patientFormTabForFieldPath(path: string): PatientFormTabId {
  const root = path.split('.')[0];
  if (root === 'medicalHistory') return 'medical';
  if (root === 'vitalSigns') return 'vitals';
  if (root === 'affiliation') return 'affiliation';
  if ((GENERAL_PREFIXES as readonly string[]).includes(root)) return 'general';
  return 'general';
}

function isFieldError(value: unknown): value is { message?: unknown } {
  return value != null && typeof value === 'object' && 'message' in value;
}

/** Depth-first walk of nested FieldErrors; returns first dot path with a message. */
export function resolveFirstPatientFormErrorPath(
  errors: FieldErrors<PatientFormInput>,
  prefix = '',
): string | undefined {
  for (const key of Object.keys(errors)) {
    const node = errors[key as keyof typeof errors];
    if (node == null) continue;

    const path = prefix ? `${prefix}.${key}` : key;

    if (isFieldError(node) && node.message != null && String(node.message).length > 0) {
      return path;
    }

    if (typeof node === 'object' && !isFieldError(node)) {
      const nested = resolveFirstPatientFormErrorPath(
        node as FieldErrors<PatientFormInput>,
        path,
      );
      if (nested) return nested;
    }
  }
  return undefined;
}

/** Focus or scroll to the control for a patient form field path. */
export function focusPatientFormField(path: string): void {
  const root = path.split('.')[0];
  const vitalKey = path.startsWith('vitalSigns.') ? path.split('.')[1] : undefined;

  const selectors = [
    vitalKey ? `#vital-${vitalKey}` : null,
    `[name="${path}"]`,
    `[name="${root}"]`,
    `#${root}`,
  ].filter(Boolean) as string[];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element instanceof HTMLElement) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (
        element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement ||
        element instanceof HTMLSelectElement
      ) {
        element.focus({ preventScroll: true });
      }
      return;
    }
  }
}
