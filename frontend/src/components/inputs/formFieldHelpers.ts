/**
 * Shared helpers for FormField components (Input, Textarea, Select).
 */

import { ICONS } from '@/utils';
import type { IconName } from '@/components/primitives/Icon';

export type FormFieldKind = 'input' | 'textarea' | 'select';

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

  if (kind === 'input') {
    if (t === 'email' || n.includes('email')) return 'mail';
    if (t === 'tel' || n.includes('phone')) return 'phone';
    if (n.includes('height')) return 'ruler';
    if (n.includes('weight')) return 'weight';
    if (n.includes('name')) return 'user';
    if (n.includes('address') || n.includes('street')) return 'map';
    if (n.includes('city')) return 'city';
    if (n.includes('postal') || n.includes('zip')) return 'mail';
    return undefined;
  }

  if (kind === 'textarea') {
    if (n.includes('note') || n.includes('comment')) return ICONS.actions.pen;
    if (n.includes('history') || n.includes('medical')) return ICONS.dataFields.medicalKit;
    return ICONS.dataFields.document;
  }

  if (kind === 'select') {
    if (n.includes('gender')) return ICONS.dataFields.userHands;
    if (n.includes('relationship')) return ICONS.ui.link;
    if (n.includes('duration') || n.includes('affiliation')) return ICONS.dataFields.time;
    return ICONS.actions.infoCircle;
  }

  return undefined;
}
