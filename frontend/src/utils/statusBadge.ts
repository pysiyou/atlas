/**
 * Domain status → badge color and display labels.
 * Used by Badge and feature formatters — not primitive styling.
 */

import type { BadgeColor } from '@/components/primitives/badgeTypes';

export const ORDER_STATUS_BADGE_COLORS: Record<string, BadgeColor> = {
  ordered: 'info',
  running: 'warning',
  completed: 'success',
  cancelled: 'danger',
};

export const SAMPLE_STATUS_BADGE_COLORS: Record<string, BadgeColor> = {
  pending: 'neutral',
  collected: 'info',
  received: 'info',
  accessioned: 'info',
  'sample-collected': 'info',
  resulted: 'purple',
  validated: 'success',
  cancelled: 'danger',
  escalated: 'danger',
  superseded: 'neutral',
  removed: 'neutral',
  stored: 'teal',
  disposed: 'neutral',
};

export const PAYMENT_STATUS_BADGE_COLORS: Record<string, BadgeColor> = {
  unpaid: 'danger',
  pending: 'warning',
  partial: 'orange',
  paid: 'success',
  refunded: 'info',
  cancelled: 'neutral',
};

export const CATALOG_STATUS_BADGE_COLORS: Record<string, BadgeColor> = {
  active: 'success',
  inactive: 'neutral',
  deprecated: 'warning',
  draft: 'info',
  blood: 'danger',
  urine: 'warning',
  stool: 'orange',
  swab: 'info',
  tissue: 'purple',
  csf: 'teal',
  sputum: 'indigo',
  plasma: 'pink',
  serum: 'cyan',
  other: 'neutral',
};

export const MISC_STATUS_BADGE_COLORS: Record<string, BadgeColor> = {
  default: 'neutral',
  primary: 'primary',
  secondary: 'neutral',
  outline: 'neutral',
  ghost: 'neutral',
  error: 'danger',
  rejected: 'danger',
  escalated: 'danger',
  low: 'neutral',
  medium: 'info',
  high: 'warning',
  urgent: 'danger',
  male: 'info',
  female: 'pink',
  friend: 'purple',
  child: 'info',
  parent: 'success',
  sibling: 'danger',
  spouse: 'warning',
  'chronic-condition': 'orange',
  medication: 'info',
  allergy: 'danger',
  surgery: 'purple',
  administrator: 'danger',
  receptionist: 'info',
  'lab-technician': 'success',
  'lab-technician-plus': 'purple',
  pathologist: 'purple',
};

const STATUS_BADGE_COLOR_MAP: Record<string, BadgeColor> = {
  danger: 'danger',
  warning: 'warning',
  success: 'success',
  info: 'info',
  neutral: 'neutral',
  ...MISC_STATUS_BADGE_COLORS,
  ...ORDER_STATUS_BADGE_COLORS,
  ...SAMPLE_STATUS_BADGE_COLORS,
  ...PAYMENT_STATUS_BADGE_COLORS,
  ...CATALOG_STATUS_BADGE_COLORS,
};

export const STATUS_BADGE_DISPLAY_LABELS: Record<string, string> = {
  pending: 'PENDING',
  'sample-collected': 'COLLECTED',
  running: 'RUNNING',
  resulted: 'RESULTED',
  validated: 'VALIDATED',
  cancelled: 'CANCELLED',
  escalated: 'ESCALATED',
  superseded: 'SUPERSEDED',
  removed: 'REMOVED',
  'chronic-condition': 'CHRONIC',
  'credit-card': 'CREDIT CARD',
  'debit-card': 'DEBIT CARD',
  'bank-transfer': 'BANK TRANSFER',
  mobile: 'MOBILE',
  're-test': 'RE-TEST',
  're-collect': 'RE-COLLECT',
  escalate: 'ESCALATE',
  authorize_retest: 'AUTHORIZE RE-TEST',
  authorize_recollect: 'AUTHORIZE RE-COLLECT',
  apply_amendment: 'APPLY AMENDMENT',
  cancel_test: 'CANCEL TEST',
};

export function resolveStatusBadgeColor(status: string): BadgeColor {
  return STATUS_BADGE_COLOR_MAP[status.toLowerCase()] ?? 'neutral';
}

export function resolveStatusBadgeLabel(status: string): string | undefined {
  const key = status.toLowerCase();
  return STATUS_BADGE_DISPLAY_LABELS[key];
}
