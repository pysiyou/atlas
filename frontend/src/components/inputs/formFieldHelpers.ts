/**
 * Shared helpers for FormField components (Input, Textarea, Select).
 */

import { ICONS } from '@/utils';
import type { IconName } from '@/components/primitives/Icon';

export type FormFieldKind = 'input' | 'textarea' | 'select';

function getDefaultIconForInput(name: string, type: string): IconName | undefined {
  if (type === 'email' || name.includes('email')) return 'mail';
  if (type === 'tel' || name.includes('phone')) return 'phone';
  if (name.includes('height')) return 'ruler';
  if (name.includes('weight')) return 'weight';
  if (name.includes('name')) return 'user';
  if (name.includes('address') || name.includes('street')) return 'map';
  if (name.includes('city')) return 'city';
  if (name.includes('postal') || name.includes('zip')) return 'mail';
  return undefined;
}

function getDefaultIconForTextarea(name: string): IconName {
  if (name.includes('note') || name.includes('comment')) return ICONS.actions.pen;
  if (name.includes('history') || name.includes('medical')) return ICONS.dataFields.medicalKit;
  return ICONS.dataFields.document;
}

function getDefaultIconForSelect(name: string): IconName {
  if (name.includes('gender')) return ICONS.dataFields.userHands;
  if (name.includes('relationship')) return ICONS.ui.link;
  if (name.includes('duration') || name.includes('affiliation')) return ICONS.dataFields.time;
  return ICONS.actions.infoCircle;
}

/**
 * Returns a default icon for a form field based on input type and name.
 * Used by Input, Textarea, and Select to avoid duplicating heuristics.
 */
export function getDefaultIconForField(
  kind: FormFieldKind,
  explicitIcon: IconName | undefined,
  type?: string,
  name?: string
): IconName | undefined {
  if (explicitIcon !== undefined) return explicitIcon;

  const n = (name ?? '').toLowerCase();
  const t = type ?? '';

  switch (kind) {
    case 'input':
      return getDefaultIconForInput(n, t);
    case 'textarea':
      return getDefaultIconForTextarea(n);
    case 'select':
      return getDefaultIconForSelect(n);
    default:
      return undefined;
  }
}
