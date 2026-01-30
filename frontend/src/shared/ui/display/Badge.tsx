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
const BASE_CLASSES = 'inline-flex items-center font-medium rounded whitespace-nowrap';

/**
 * Size classes
 */
const SIZES = {
  xs: 'px-2 py-0.5 text-xs',
  sm: 'px-2.5 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
};

/**
 * Variant styles - comprehensive badge color system
 */
const VARIANT_STYLES: Record<string, string> = {
  // Base variants — semantic tokens
  default: 'bg-neutral-100 text-text-primary',
  primary: 'bg-action-primary text-action-primary-on',
  secondary: 'bg-action-secondary-bg text-action-secondary-text',
  outline: 'border border-border-default bg-transparent text-text-secondary',
  ghost: 'bg-transparent text-text-secondary',
  neutral: 'bg-action-secondary-bg text-action-secondary-text',
  danger: 'bg-action-danger text-action-danger-on',
  error: 'bg-action-danger text-action-danger-on',
  success: 'bg-action-success text-action-success-on',
  warning: 'bg-action-warning text-action-warning-on',
  info: 'bg-action-primary text-action-primary-on',
  purple: 'bg-purple-100 text-purple-800',
  orange: 'bg-orange-100 text-orange-800',
  teal: 'bg-teal-100 text-teal-800',
  
  // Order statuses — semantic feedback where applicable
  ordered: 'bg-blue-100 text-blue-800',
  'in-progress': 'bg-feedback-warning-bg-strong text-feedback-warning-text-strong',
  completed: 'bg-feedback-success-bg-strong text-feedback-success-text-strong',
  cancelled: 'bg-feedback-danger-bg-strong text-feedback-danger-text-strong',
  validated: 'bg-feedback-success-bg-strong text-feedback-success-text-strong',
  rejected: 'bg-feedback-danger-bg-strong text-feedback-danger-text-strong',
  escalated: 'bg-feedback-warning-bg-strong text-feedback-warning-text-strong',
  superseded: 'bg-neutral-100 text-text-tertiary',
  resulted: 'bg-feedback-success-bg-strong text-feedback-success-text-strong',
  
  // Rejection types
  're-test': 'bg-yellow-100 text-yellow-800',
  're-collect': 'bg-orange-100 text-orange-800',
  'authorize_retest': 'bg-emerald-100 text-emerald-800',
  
  // Sample statuses
  pending: 'bg-neutral-100 text-text-secondary',
  collected: 'bg-blue-100 text-blue-800',
  received: 'bg-indigo-100 text-indigo-800',
  accessioned: 'bg-purple-100 text-purple-800',
  stored: 'bg-slate-100 text-slate-800',
  disposed: 'bg-neutral-100 text-text-tertiary',
  'sample-collected': 'bg-blue-100 text-blue-800',
  
  // Appointment statuses
  scheduled: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-feedback-success-bg-strong text-feedback-success-text-strong',
  'no-show': 'bg-feedback-danger-bg-strong text-feedback-danger-text-strong',
  
  // Payment statuses
  partial: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-feedback-success-bg-strong text-feedback-success-text-strong',
  unpaid: 'bg-feedback-danger-bg-strong text-feedback-danger-text-strong',
  
  // Priorities
  routine: 'bg-neutral-100 text-text-secondary',
  urgent: 'bg-feedback-warning-bg-strong text-feedback-warning-text-strong',
  stat: 'bg-feedback-danger-bg-strong text-feedback-danger-text-strong',
  
  // Test categories
  hematology: 'bg-feedback-danger-bg-strong text-feedback-danger-text-strong',
  biochemistry: 'bg-blue-100 text-blue-800',
  microbiology: 'bg-feedback-success-bg-strong text-feedback-success-text-strong',
  serology: 'bg-purple-100 text-purple-800',
  urinalysis: 'bg-yellow-100 text-yellow-800',
  imaging: 'bg-indigo-100 text-indigo-800',
  immunology: 'bg-pink-100 text-pink-800',
  molecular: 'bg-teal-100 text-teal-800',
  toxicology: 'bg-orange-100 text-orange-800',
  coagulation: 'bg-feedback-danger-bg-strong text-feedback-danger-text-strong',
  chemistry: 'bg-blue-100 text-blue-800',
  
  // Sample types
  blood: 'bg-feedback-danger-bg-strong text-feedback-danger-text-strong',
  urine: 'bg-yellow-100 text-yellow-800',
  stool: 'bg-feedback-warning-bg-strong text-feedback-warning-text-strong',
  swab: 'bg-blue-100 text-blue-800',
  tissue: 'bg-pink-100 text-pink-800',
  fluid: 'bg-cyan-100 text-cyan-800',
  csf: 'bg-indigo-100 text-indigo-800',
  sputum: 'bg-feedback-success-bg-strong text-feedback-success-text-strong',
  other: 'bg-neutral-100 text-text-secondary',
  plasma: 'bg-feedback-danger-bg-strong text-feedback-danger-text-strong',
  serum: 'bg-feedback-warning-bg-strong text-feedback-warning-text-strong',
  
  // Sex/Gender
  male: 'bg-blue-100 text-blue-800',
  female: 'bg-pink-100 text-pink-800',
  
  
  friend: 'bg-purple-100 text-purple-800',
  child: 'bg-blue-100 text-blue-800',
  parent: 'bg-feedback-success-bg-strong text-feedback-success-text-strong',
  sibling: 'bg-feedback-danger-bg-strong text-feedback-danger-text-strong',
  spouse: 'bg-yellow-100 text-yellow-800',
  
  // Medical history
  'chronic-condition': 'bg-orange-100 text-orange-800',
  medication: 'bg-blue-100 text-blue-800',
  allergy: 'bg-feedback-danger-bg-strong text-feedback-danger-text-strong',
  surgery: 'bg-purple-100 text-purple-800',
  
  // Container colors
  'container-red': 'bg-red-500 text-text-inverse',
  'container-yellow': 'bg-yellow-400 text-gray-900',
  'container-purple': 'bg-purple-500 text-text-inverse',
  'container-blue': 'bg-blue-500 text-text-inverse',
  'container-green': 'bg-green-500 text-text-inverse',
  'container-gray': 'bg-gray-500 text-text-inverse',
  'container-black': 'bg-gray-900 text-text-inverse',
  
  // Payment methods
  cash: 'bg-feedback-success-bg-strong text-feedback-success-text-strong',
  'credit-card': 'bg-blue-100 text-blue-800',
  'debit-card': 'bg-indigo-100 text-indigo-800',
  insurance: 'bg-purple-100 text-purple-800',
  'bank-transfer': 'bg-cyan-100 text-cyan-800',
  'mobile-money': 'bg-teal-100 text-teal-800',
  
  // User roles
  administrator: 'bg-feedback-danger-bg-strong text-feedback-danger-text-strong',
  receptionist: 'bg-blue-100 text-blue-800',
  'lab-technician': 'bg-feedback-success-bg-strong text-feedback-success-text-strong',
  'lab-technician-plus': 'bg-purple-100 text-purple-800',
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
      {iconElement && <span className="mr-1 shrink-0">{iconElement}</span>}
      {content}
    </div>
  );
};
