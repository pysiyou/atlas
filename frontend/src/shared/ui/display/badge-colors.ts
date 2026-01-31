/**
 * Badge Color System
 *
 * Uses the application's semantic token system for theme adaptation.
 * Colors automatically adapt based on data-theme attribute.
 */

/**
 * Semantic color palette - maps to theme tokens
 */
export type BadgeColor =
  | 'neutral'   // default, pending, routine, muted states
  | 'primary'   // brand-colored items
  | 'success'   // positive: completed, validated, paid
  | 'warning'   // caution: in-progress, urgent, partial
  | 'danger'    // negative: cancelled, rejected, stat
  | 'info'      // informational: ordered, scheduled
  | 'purple'    // accessioned, serology, insurance
  | 'pink'      // female, tissue, immunology
  | 'teal'      // molecular, mobile-money
  | 'orange'    // toxicology, chronic-condition
  | 'indigo'    // received, imaging
  | 'cyan'      // fluid, bank-transfer
  | 'muted';    // superseded, disposed, inactive

/**
 * Domain value to semantic color mapping
 */
const COLOR_MAP: Record<string, BadgeColor> = {
  // Base
  default: 'neutral',
  primary: 'primary',
  secondary: 'neutral',
  outline: 'neutral',
  ghost: 'neutral',
  error: 'danger',

  // Order/Test status
  ordered: 'info',
  'in-progress': 'warning',
  completed: 'success',
  cancelled: 'danger',
  validated: 'success',
  rejected: 'danger',
  escalated: 'warning',
  superseded: 'muted',
  resulted: 'success',

  // Rejection types
  're-test': 'warning',
  're-collect': 'orange',
  authorize_retest: 'success',

  // Sample status
  pending: 'neutral',
  collected: 'info',
  received: 'indigo',
  accessioned: 'purple',
  stored: 'neutral',
  disposed: 'muted',
  'sample-collected': 'info',

  // Appointment
  scheduled: 'info',
  confirmed: 'success',
  'no-show': 'danger',

  // Payment
  partial: 'warning',
  paid: 'success',
  unpaid: 'danger',

  // Priority
  routine: 'neutral',
  urgent: 'warning',
  stat: 'danger',

  // Test categories
  hematology: 'danger',
  biochemistry: 'info',
  microbiology: 'success',
  serology: 'purple',
  urinalysis: 'warning',
  imaging: 'indigo',
  immunology: 'pink',
  molecular: 'teal',
  toxicology: 'orange',
  coagulation: 'danger',
  chemistry: 'info',

  // Sample types
  blood: 'danger',
  urine: 'warning',
  stool: 'warning',
  swab: 'info',
  tissue: 'pink',
  fluid: 'cyan',
  csf: 'indigo',
  sputum: 'success',
  other: 'neutral',
  plasma: 'danger',
  serum: 'warning',

  // Gender
  male: 'info',
  female: 'pink',

  // Relationships
  friend: 'purple',
  child: 'info',
  parent: 'success',
  sibling: 'danger',
  spouse: 'warning',

  // Medical history
  'chronic-condition': 'orange',
  medication: 'info',
  allergy: 'danger',
  surgery: 'purple',

  // Payment methods
  cash: 'success',
  'credit-card': 'info',
  'debit-card': 'indigo',
  insurance: 'purple',
  'bank-transfer': 'cyan',
  'mobile-money': 'teal',

  // User roles
  administrator: 'danger',
  receptionist: 'info',
  'lab-technician': 'success',
  'lab-technician-plus': 'purple',
  pathologist: 'purple',
};

/**
 * Resolve any variant string to a semantic color
 */
export function resolveColor(variant: string): BadgeColor {
  return COLOR_MAP[variant.toLowerCase()] ?? 'neutral';
}

/**
 * Unified appearance: neutral background, colored text + dot
 * Uses theme semantic tokens that adapt automatically
 */
const UNIFIED_STYLES: Record<BadgeColor, { text: string; dot: string }> = {
  neutral: {
    text: 'text-text-secondary',
    dot: 'bg-text-tertiary',
  },
  primary: {
    text: 'text-action-primary',
    dot: 'bg-action-primary',
  },
  success: {
    text: 'text-feedback-success-text-strong',
    dot: 'bg-feedback-success-text-strong',
  },
  warning: {
    text: 'text-feedback-warning-text-strong',
    dot: 'bg-feedback-warning-text-strong',
  },
  danger: {
    text: 'text-feedback-danger-text-strong',
    dot: 'bg-feedback-danger-text-strong',
  },
  info: {
    text: 'text-action-primary',
    dot: 'bg-action-primary',
  },
  purple: {
    text: 'text-purple-600',
    dot: 'bg-purple-500',
  },
  pink: {
    text: 'text-pink-600',
    dot: 'bg-pink-500',
  },
  teal: {
    text: 'text-teal-600',
    dot: 'bg-teal-500',
  },
  orange: {
    text: 'text-orange-600',
    dot: 'bg-orange-500',
  },
  indigo: {
    text: 'text-indigo-600',
    dot: 'bg-indigo-500',
  },
  cyan: {
    text: 'text-cyan-600',
    dot: 'bg-cyan-500',
  },
  muted: {
    text: 'text-text-tertiary',
    dot: 'bg-text-muted',
  },
};

/**
 * Tinted appearance: colored background + text
 * Uses theme semantic tokens where available
 */
const TINTED_STYLES: Record<BadgeColor, string> = {
  neutral: 'bg-neutral-200 text-text-primary',
  primary: 'bg-action-primary text-action-primary-on',
  success: 'bg-feedback-success-bg-strong text-feedback-success-text-strong',
  warning: 'bg-feedback-warning-bg-strong text-feedback-warning-text-strong',
  danger: 'bg-feedback-danger-bg-strong text-feedback-danger-text-strong',
  info: 'bg-action-primary-muted-bg text-action-primary-text',
  purple: 'bg-purple-100 text-purple-800',
  pink: 'bg-pink-100 text-pink-800',
  teal: 'bg-teal-100 text-teal-800',
  orange: 'bg-orange-100 text-orange-800',
  indigo: 'bg-indigo-100 text-indigo-800',
  cyan: 'bg-cyan-100 text-cyan-800',
  muted: 'bg-neutral-200 text-text-tertiary',
};

/**
 * Get styles based on appearance mode
 */
export function getColorStyles(color: BadgeColor, appearance: 'unified' | 'tinted') {
  if (appearance === 'tinted') {
    return {
      className: TINTED_STYLES[color],
      dotClassName: '', // No dot in tinted mode
    };
  }
  const unified = UNIFIED_STYLES[color];
  return {
    className: unified.text,
    dotClassName: unified.dot,
  };
}

/**
 * Container color styles - solid colors for physical tube representation
 */
export const CONTAINER_STYLES: Record<string, string> = {
  'container-red': 'bg-red-500 text-white',
  'container-yellow': 'bg-yellow-400 text-neutral-900',
  'container-purple': 'bg-purple-500 text-white',
  'container-blue': 'bg-blue-500 text-white',
  'container-green': 'bg-green-500 text-white',
  'container-gray': 'bg-gray-500 text-white',
  'container-black': 'bg-neutral-900 text-white',
};

/**
 * Display labels for specific variants
 */
export const DISPLAY_LABELS: Record<string, string> = {
  'sample-collected': 'COLLECTED',
  'in-progress': 'RUNNING',
  'no-show': 'NO SHOW',
  'chronic-condition': 'CHRONIC',
  'credit-card': 'CREDIT CARD',
  'debit-card': 'DEBIT CARD',
  'bank-transfer': 'BANK TRANSFER',
  'mobile-money': 'MOBILE MONEY',
  're-test': 'RE-TEST',
  're-collect': 'RE-COLLECT',
  authorize_retest: 'AUTHORIZE RE-TEST',
};

/**
 * Variants that should pulse by default
 */
export const CRITICAL_VARIANTS = new Set(['critical', 'critical-high', 'critical-low', 'stat']);

/**
 * Size configurations
 */
export const SIZES = {
  xs: 'px-1.5 py-0.5 text-[10px] gap-1',
  sm: 'px-2 py-0.5 text-xs gap-1.5',
  md: 'px-2.5 py-1 text-sm gap-1.5',
} as const;

export const ICON_SIZES = {
  xs: 'w-3 h-3',
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
} as const;

export type BadgeSize = keyof typeof SIZES;
export type BadgeVariant = BadgeColor | keyof typeof COLOR_MAP | (string & {});

/**
 * Tag styles for selected items in inputs (patient/test select)
 * Adapts based on theme appearance
 */
export const TAG_STYLES = {
  unified: {
    container: 'bg-badge-bg border border-border-default shadow-sm',
    text: 'text-text-primary',
    code: 'text-action-primary',
    remove: 'text-text-tertiary hover:text-text-secondary',
  },
  tinted: {
    container: 'bg-action-primary-muted-bg border border-action-primary/20',
    text: 'text-text-primary',
    code: 'text-action-primary',
    remove: 'text-action-primary/60 hover:text-action-primary',
  },
} as const;
