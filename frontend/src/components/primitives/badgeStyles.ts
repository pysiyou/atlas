/**
 * Badge color maps, labels, and appearance helpers.
 */

export type BadgeColor =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'purple'
  | 'pink'
  | 'teal'
  | 'orange'
  | 'indigo'
  | 'cyan'
  | 'muted';

const ORDER_COLOR_MAP: Record<string, BadgeColor> = {
  ordered: 'info',
  'in-progress': 'warning',
  completed: 'success',
  cancelled: 'danger',
};

const SAMPLE_COLOR_MAP: Record<string, BadgeColor> = {
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

const PAYMENT_COLOR_MAP: Record<string, BadgeColor> = {
  unpaid: 'danger',
  pending: 'warning',
  partial: 'orange',
  paid: 'success',
  refunded: 'info',
  cancelled: 'neutral',
};

const CATALOG_COLOR_MAP: Record<string, BadgeColor> = {
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

const MISC_COLOR_MAP: Record<string, BadgeColor> = {
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

const COLOR_MAP: Record<string, BadgeColor> = {
  danger: 'danger',
  warning: 'warning',
  success: 'success',
  info: 'info',
  neutral: 'neutral',
  ...MISC_COLOR_MAP,
  ...ORDER_COLOR_MAP,
  ...SAMPLE_COLOR_MAP,
  ...PAYMENT_COLOR_MAP,
  ...CATALOG_COLOR_MAP,
};

export type BadgeVariant = BadgeColor | keyof typeof COLOR_MAP | (string & {});

const UNIFIED_STYLES: Record<BadgeColor, { text: string; dot: string }> = {
  neutral: { text: 'text-text-secondary', dot: 'bg-text-tertiary' },
  primary: { text: 'text-brand', dot: 'bg-brand' },
  success: { text: 'text-success-fg-emphasis', dot: 'bg-success-fg-emphasis' },
  warning: { text: 'text-warning-fg-emphasis', dot: 'bg-warning-fg-emphasis' },
  danger: { text: 'text-danger-fg-emphasis', dot: 'bg-danger-fg-emphasis' },
  info: { text: 'text-info-fg-emphasis', dot: 'bg-info-fg-emphasis' },
  purple: { text: 'text-purple-fg-emphasis', dot: 'bg-purple-fg-emphasis' },
  pink: { text: 'text-pink-fg-emphasis', dot: 'bg-pink-fg-emphasis' },
  teal: { text: 'text-teal-fg-emphasis', dot: 'bg-teal-fg-emphasis' },
  orange: { text: 'text-orange-fg-emphasis', dot: 'bg-orange-fg-emphasis' },
  indigo: { text: 'text-indigo-fg-emphasis', dot: 'bg-indigo-fg-emphasis' },
  cyan: { text: 'text-cyan-fg-emphasis', dot: 'bg-cyan-fg-emphasis' },
  muted: { text: 'text-text-tertiary', dot: 'bg-text-muted' },
};

const TINTED_STYLES: Record<BadgeColor, string> = {
  neutral: 'bg-neutral-200 text-text-primary',
  primary: 'bg-brand text-on-brand',
  success: 'bg-success-bg-emphasis text-success-fg-emphasis',
  warning: 'bg-warning-bg-emphasis text-warning-fg-emphasis',
  danger: 'bg-danger-bg-emphasis text-danger-fg-emphasis',
  info: 'bg-info-bg text-info-fg-emphasis',
  purple: 'bg-purple-bg-emphasis text-purple-fg-emphasis',
  pink: 'bg-pink-bg-emphasis text-pink-fg-emphasis',
  teal: 'bg-teal-bg-emphasis text-teal-fg-emphasis',
  orange: 'bg-orange-bg-emphasis text-orange-fg-emphasis',
  indigo: 'bg-indigo-bg-emphasis text-indigo-fg-emphasis',
  cyan: 'bg-cyan-bg-emphasis text-cyan-fg-emphasis',
  muted: 'bg-neutral-200 text-text-tertiary',
};

export const CONTAINER_STYLES: Record<string, string> = {
  'container-red': 'bg-container-red-bg text-container-red-text',
  'container-yellow': 'bg-container-yellow-bg text-container-yellow-text',
  'container-purple': 'bg-container-purple-bg text-container-purple-text',
  'container-blue': 'bg-container-blue-bg text-container-blue-text',
  'container-green': 'bg-container-green-bg text-container-green-text',
  'container-gray': 'bg-container-gray-bg text-container-gray-text',
  'container-black': 'bg-container-black-bg text-container-black-text',
};

export const DISPLAY_LABELS: Record<string, string> = {
  pending: 'PENDING',
  'sample-collected': 'COLLECTED',
  'in-progress': 'IN PROGRESS',
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

/** Unified = neutral surface + colored text; tinted = filled chip. */
export function getColorStyles(color: BadgeColor, appearance: 'unified' | 'tinted') {
  if (appearance === 'tinted') {
    return { className: TINTED_STYLES[color], dotClassName: '' };
  }
  const u = UNIFIED_STYLES[color];
  return { className: u.text, dotClassName: u.dot };
}

export function resolveColor(variant: string): BadgeColor {
  return COLOR_MAP[variant.toLowerCase()] ?? 'neutral';
}
