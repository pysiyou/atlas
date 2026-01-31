import React from 'react';
import { cn } from '@/utils';
import { Icon, type IconName } from './Icon';

export type BadgeVariant =
  // Base variants
  | 'default'
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'neutral'
  | 'danger'
  | 'error'
  | 'success'
  | 'warning'
  | 'info'
  | 'purple'
  | 'orange'
  | 'teal'
  // Order Statuses
  | 'ordered'
  | 'in-progress'
  | 'completed'
  | 'cancelled'
  | 'validated'
  | 'rejected'
  | 'escalated'
  | 'superseded'
  // Test Statuses (in addition to above)
  | 'resulted'
  // Rejection Types
  | 're-test'
  | 're-collect'
  | 'authorize_retest'
  // Sample Statuses
  | 'pending'
  | 'collected'
  | 'received'
  | 'accessioned'
  | 'stored'
  | 'disposed'
  | 'sample-collected'
  // Appointment Statuses
  | 'scheduled'
  | 'confirmed'
  | 'no-show'
  // Payment Statuses
  | 'partial'
  | 'paid'
  | 'unpaid'
  // Priorities
  | 'routine'
  | 'urgent'
  | 'stat'
  // Test Categories
  | 'hematology'
  | 'biochemistry'
  | 'microbiology'
  | 'serology'
  | 'urinalysis'
  | 'imaging'
  | 'immunology'
  | 'molecular'
  | 'toxicology'
  | 'coagulation'
  | 'chemistry'
  // Sample Types
  | 'blood'
  | 'urine'
  | 'stool'
  | 'swab'
  | 'tissue'
  | 'fluid'
  | 'csf'
  | 'sputum'
  | 'other'
  | 'plasma'
  | 'serum'
  // Sex/Gender
  | 'male'
  | 'female'
  // Relationships (Emergency Contact)
  | 'spouse'
  | 'parent'
  | 'sibling'
  | 'child'
  | 'friend'
  // Medical History
  | 'chronic-condition'
  | 'medication'
  | 'allergy'
  | 'surgery'
  // Container Top Colors (for physical tube representation)
  | 'container-red'
  | 'container-yellow'
  | 'container-purple'
  | 'container-blue'
  | 'container-green'
  | 'container-gray'
  | 'container-black'
  // Payment Methods
  | 'cash'
  | 'credit-card'
  | 'debit-card'
  | 'insurance'
  | 'bank-transfer'
  | 'mobile-money'
  // User Roles
  | 'administrator'
  | 'receptionist'
  | 'lab-technician'
  | 'lab-technician-plus'
  // Arbitrary string fallback
  | (string & {});

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
  size?: 'xs' | 'sm' | 'md';
  /** Apply strikethrough styling to the badge content */
  strikethrough?: boolean;
  /** Enable pulsing animation for critical values */
  pulse?: boolean;
  /** Optional icon to display before the badge text */
  icon?: IconName | React.ReactNode;
  /** Whether to auto-detect icon based on variant (for priority, status, sample type) */
  showIcon?: boolean;
}

/**
 * Base badge classes
 */
const BASE_CLASSES = 'inline-flex items-center font-medium rounded whitespace-nowrap shadow-sm border border-border-default';

/**
 * Size classes
 */
const SIZES = {
  xs: 'px-2 py-0.5 text-xs',
  sm: 'px-2.5 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
};

/** Single shared background for all badges (theme token); variants only set text color */
const BADGE_BG = 'bg-badge-bg';

/**
 * Variant styles — same bg for all; text color only
 */
const VARIANT_STYLES: Record<string, string> = {
  default: `${BADGE_BG} text-text-primary`,
  primary: `${BADGE_BG} text-action-primary`,
  secondary: `${BADGE_BG} text-action-secondary-text`,
  outline: `${BADGE_BG} border border-border-default text-text-secondary`,
  ghost: `${BADGE_BG} text-text-secondary`,
  neutral: `${BADGE_BG} text-action-secondary-text`,
  danger: `${BADGE_BG} text-feedback-danger-text-strong`,
  error: `${BADGE_BG} text-feedback-danger-text-strong`,
  success: `${BADGE_BG} text-feedback-success-text-strong`,
  warning: `${BADGE_BG} text-feedback-warning-text-strong`,
  info: `${BADGE_BG} text-action-primary`,
  purple: `${BADGE_BG} text-purple-800`,
  orange: `${BADGE_BG} text-orange-800`,
  teal: `${BADGE_BG} text-teal-800`,

  ordered: `${BADGE_BG} text-blue-800`,
  'in-progress': `${BADGE_BG} text-feedback-warning-text-strong`,
  completed: `${BADGE_BG} text-feedback-success-text-strong`,
  cancelled: `${BADGE_BG} text-feedback-danger-text-strong`,
  validated: `${BADGE_BG} text-feedback-success-text-strong`,
  rejected: `${BADGE_BG} text-feedback-danger-text-strong`,
  escalated: `${BADGE_BG} text-feedback-warning-text-strong`,
  superseded: `${BADGE_BG} text-text-tertiary`,
  resulted: `${BADGE_BG} text-feedback-success-text-strong`,

  're-test': `${BADGE_BG} text-yellow-800`,
  're-collect': `${BADGE_BG} text-orange-800`,
  authorize_retest: `${BADGE_BG} text-emerald-800`,

  pending: `${BADGE_BG} text-text-secondary`,
  collected: `${BADGE_BG} text-blue-800`,
  received: `${BADGE_BG} text-indigo-800`,
  accessioned: `${BADGE_BG} text-purple-800`,
  stored: `${BADGE_BG} text-slate-800`,
  disposed: `${BADGE_BG} text-text-tertiary`,
  'sample-collected': `${BADGE_BG} text-blue-800`,

  scheduled: `${BADGE_BG} text-blue-800`,
  confirmed: `${BADGE_BG} text-feedback-success-text-strong`,
  'no-show': `${BADGE_BG} text-feedback-danger-text-strong`,

  partial: `${BADGE_BG} text-yellow-800`,
  paid: `${BADGE_BG} text-feedback-success-text-strong`,
  unpaid: `${BADGE_BG} text-feedback-danger-text-strong`,

  routine: `${BADGE_BG} text-text-secondary`,
  urgent: `${BADGE_BG} text-feedback-warning-text-strong`,
  stat: `${BADGE_BG} text-feedback-danger-text-strong`,

  hematology: `${BADGE_BG} text-feedback-danger-text-strong`,
  biochemistry: `${BADGE_BG} text-blue-800`,
  microbiology: `${BADGE_BG} text-feedback-success-text-strong`,
  serology: `${BADGE_BG} text-purple-800`,
  urinalysis: `${BADGE_BG} text-yellow-800`,
  imaging: `${BADGE_BG} text-indigo-800`,
  immunology: `${BADGE_BG} text-pink-800`,
  molecular: `${BADGE_BG} text-teal-800`,
  toxicology: `${BADGE_BG} text-orange-800`,
  coagulation: `${BADGE_BG} text-feedback-danger-text-strong`,
  chemistry: `${BADGE_BG} text-blue-800`,

  blood: `${BADGE_BG} text-feedback-danger-text-strong`,
  urine: `${BADGE_BG} text-yellow-800`,
  stool: `${BADGE_BG} text-feedback-warning-text-strong`,
  swab: `${BADGE_BG} text-blue-800`,
  tissue: `${BADGE_BG} text-pink-800`,
  fluid: `${BADGE_BG} text-cyan-800`,
  csf: `${BADGE_BG} text-indigo-800`,
  sputum: `${BADGE_BG} text-feedback-success-text-strong`,
  other: `${BADGE_BG} text-text-secondary`,
  plasma: `${BADGE_BG} text-feedback-danger-text-strong`,
  serum: `${BADGE_BG} text-feedback-warning-text-strong`,

  male: `${BADGE_BG} text-blue-800`,
  female: `${BADGE_BG} text-pink-800`,

  friend: `${BADGE_BG} text-purple-800`,
  child: `${BADGE_BG} text-blue-800`,
  parent: `${BADGE_BG} text-feedback-success-text-strong`,
  sibling: `${BADGE_BG} text-feedback-danger-text-strong`,
  spouse: `${BADGE_BG} text-yellow-800`,

  'chronic-condition': `${BADGE_BG} text-orange-800`,
  medication: `${BADGE_BG} text-blue-800`,
  allergy: `${BADGE_BG} text-feedback-danger-text-strong`,
  surgery: `${BADGE_BG} text-purple-800`,

  'container-red': `${BADGE_BG} text-red-600`,
  'container-yellow': `${BADGE_BG} text-yellow-700`,
  'container-purple': `${BADGE_BG} text-purple-600`,
  'container-blue': `${BADGE_BG} text-blue-600`,
  'container-green': `${BADGE_BG} text-green-600`,
  'container-gray': `${BADGE_BG} text-gray-600`,
  'container-black': `${BADGE_BG} text-gray-900`,

  cash: `${BADGE_BG} text-feedback-success-text-strong`,
  'credit-card': `${BADGE_BG} text-blue-800`,
  'debit-card': `${BADGE_BG} text-indigo-800`,
  insurance: `${BADGE_BG} text-purple-800`,
  'bank-transfer': `${BADGE_BG} text-cyan-800`,
  'mobile-money': `${BADGE_BG} text-teal-800`,

  administrator: `${BADGE_BG} text-feedback-danger-text-strong`,
  receptionist: `${BADGE_BG} text-blue-800`,
  'lab-technician': `${BADGE_BG} text-feedback-success-text-strong`,
  'lab-technician-plus': `${BADGE_BG} text-purple-800`,
};

// Custom display labels for variants (shorter/abbreviated versions)
const VARIANT_LABELS: Record<string, string> = {
  'sample-collected': 'COLLECTED',
  'in-progress': 'RUNNING',
  'no-show': 'NO SHOW',
  'chronic-condition': 'CHRONIC',
  superseded: 'SUPERSEDED', // Test replaced by retest
  removed: 'REMOVED', // Test removed from order
  // Payment method labels
  'credit-card': 'CREDIT CARD',
  'debit-card': 'DEBIT CARD',
  'bank-transfer': 'BANK TRANSFER',
  'mobile-money': 'MOBILE MONEY',
  // Rejection type labels
  're-test': 'RE-TEST',
  're-collect': 'RE-COLLECT',
  'authorize_retest': 'AUTHORIZE RE-TEST',
};

/**
 * Badge Component
 *
 * Displays a small badge with color variants.
 * Uses a single `variant` prop to determine styling based on:
 * - Base colors (primary, danger, etc.)
 * - Status (ordered, completed, etc.)
 * - Priority (urgent, stat, etc.)
 * - Sample Type (blood, urine, etc.)
 * - Sex (male, female)
 *
 * If `children` is omitted, it will try to format the `variant` string to display.
 */
// Critical value variants that should pulse by default
const CRITICAL_VARIANTS = new Set([
  'critical',
  'critical-high',
  'critical-low',
]);

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'md',
  strikethrough = false,
  pulse,
  icon,
  showIcon = false,
  children,
  ...props
}) => {
  // Normalize variant to lowercase string for lookup
  const normalizedVariant = String(variant).toLowerCase();

  // Lookup style or fallback to default
  const variantClass = VARIANT_STYLES[normalizedVariant] || VARIANT_STYLES.default;

  // Auto-generate content if children is missing (and it's not a generic variant like 'default')
  let content = children;

  if (!content && variant !== 'default') {
    // Use custom label if available, otherwise format the variant string
    content = VARIANT_LABELS[normalizedVariant] || String(variant).replace(/-/g, ' ').toUpperCase();
  }

  // Determine if should pulse (explicit prop or critical variant)
  const shouldPulse = pulse ?? CRITICAL_VARIANTS.has(normalizedVariant);

  // Determine icon size based on badge size
  const iconSizeClass = size === 'xs' ? 'w-3 h-3' : size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  // Render icon if provided or if showIcon is true (auto-detect from variant)
  const renderIcon = () => {
    if (icon) {
      // If icon is a ReactNode, render it directly
      if (React.isValidElement(icon)) {
        return icon;
      }
      // If icon is an IconName string, render Icon component
      return <Icon name={icon as IconName} className={iconSizeClass} />;
    }

    if (showIcon) {
      // Auto-detect icon based on variant using icon helpers
      // This is optional and can be enhanced later
      return null;
    }

    return null;
  };

  const iconElement = renderIcon();

  return (
    <div
      className={cn(
        BASE_CLASSES,
        variantClass,
        SIZES[size],
        strikethrough && 'line-through',
        shouldPulse && 'animate-pulse',
        className
      )}
      {...props}
    >
      <span
        className={cn('w-1 h-1 rounded-full bg-current shrink-0', iconElement || content ? 'mr-1.5' : '')}
        aria-hidden
      />
      {iconElement && <span className="mr-1 shrink-0">{iconElement}</span>}
      {content}
    </div>
  );
};
