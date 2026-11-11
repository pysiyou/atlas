/**
 * Cross-feature patient presentation helpers (tables, worklists, order context).
 * Patient-feature-only formatters stay in `@/features/patients/utils/patientFormatters`.
 */

import type { Gender } from '@/types';
import { GENDER_CONFIG } from '@/types';
import { calculateAge } from '@/utils/string';

/**
 * Compact sex + age for tables and worklists (e.g. `"Male · 42 years old"`).
 * Returns `null` when neither sex nor a finite age can be shown.
 *
 * @param gender - Catalog gender value or free-text fallback
 * @param dateOfBirth - ISO date used by `calculateAge`
 */
export function formatPatientSexAgeLine(
  gender?: Gender | string | null,
  dateOfBirth?: string | null,
): string | null {
  const parts: string[] = [];
  if (gender) {
    const label = GENDER_CONFIG[gender as Gender]?.label;
    parts.push(label ?? String(gender));
  }
  const age = dateOfBirth ? calculateAge(dateOfBirth) : null;
  if (age != null && Number.isFinite(age)) {
    parts.push(age === 1 ? '1 year old' : `${age} years old`);
  }
  return parts.length > 0 ? parts.join(' · ') : null;
}
