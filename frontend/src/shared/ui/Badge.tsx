import React from 'react';
import { cn } from '@/utils';
import { Icon } from './Icon';
import type { IconName } from './Icon';

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
  | 'superseded'
  // Test Statuses (in addition to above)
  | 'resulted'
  // Rejection Types
  | 're-test'
  | 're-collect'
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
  | 'receptionist'
  | 'lab-technician'
  | 'pathologist'
  | 'administrator'
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
  // Base variants
  default: 'bg-neutral-100 text-text-primary',
  primary: 'bg-brand text-text-inverse',
  secondary: 'bg-neutral-200 text-text-primary',
  outline: 'border border-border bg-transparent text-text-secondary',
  ghost: 'bg-transparent text-text-secondary',
  neutral: 'bg-neutral-200 text-text-primary',
  danger: 'bg-danger text-text-inverse',
  error: 'bg-danger text-text-inverse',
  success: 'bg-success text-text-inverse',
  warning: 'bg-warning text-text-inverse',
  info: 'bg-info text-text-inverse',
  purple: 'bg-purple-100 text-purple-800',
  orange: 'bg-orange-100 text-orange-800',
  teal: 'bg-teal-100 text-teal-800',
  
  // Order statuses
  ordered: 'bg-blue-100 text-blue-800',
  'in-progress': 'bg-amber-100 text-amber-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  validated: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  superseded: 'bg-gray-100 text-gray-600',
  resulted: 'bg-green-100 text-green-800',
  
  // Rejection types
  're-test': 'bg-yellow-100 text-yellow-800',
  're-collect': 'bg-orange-100 text-orange-800',
  
  // Sample statuses
  pending: 'bg-gray-100 text-gray-800',
  collected: 'bg-blue-100 text-blue-800',
  received: 'bg-indigo-100 text-indigo-800',
  accessioned: 'bg-purple-100 text-purple-800',
  stored: 'bg-slate-100 text-slate-800',
  disposed: 'bg-gray-100 text-gray-600',
  'sample-collected': 'bg-blue-100 text-blue-800',
  
  // Appointment statuses
  scheduled: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
  'no-show': 'bg-red-100 text-red-800',
  
  // Payment statuses
  partial: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  unpaid: 'bg-red-100 text-red-800',
  
  // Priorities
  routine: 'bg-gray-100 text-gray-800',
  urgent: 'bg-orange-100 text-orange-800',
  stat: 'bg-red-100 text-red-800',
  
  // Test categories
  hematology: 'bg-red-100 text-red-800',
  biochemistry: 'bg-blue-100 text-blue-800',
  microbiology: 'bg-green-100 text-green-800',
  serology: 'bg-purple-100 text-purple-800',
  urinalysis: 'bg-yellow-100 text-yellow-800',
  imaging: 'bg-indigo-100 text-indigo-800',
  immunology: 'bg-pink-100 text-pink-800',
  molecular: 'bg-teal-100 text-teal-800',
  toxicology: 'bg-orange-100 text-orange-800',
  coagulation: 'bg-red-100 text-red-800',
  chemistry: 'bg-blue-100 text-blue-800',
  
  // Sample types
  blood: 'bg-red-100 text-red-800',
  urine: 'bg-yellow-100 text-yellow-800',
  stool: 'bg-amber-100 text-amber-800',
  swab: 'bg-blue-100 text-blue-800',
  tissue: 'bg-pink-100 text-pink-800',
  fluid: 'bg-cyan-100 text-cyan-800',
  csf: 'bg-indigo-100 text-indigo-800',
  sputum: 'bg-green-100 text-green-800',
  other: 'bg-gray-100 text-gray-800',
  plasma: 'bg-red-100 text-red-800',
  serum: 'bg-amber-100 text-amber-800',
  
  // Sex/Gender
  male: 'bg-blue-100 text-blue-800',
  female: 'bg-pink-100 text-pink-800',
  
  // Medical history
  'chronic-condition': 'bg-orange-100 text-orange-800',
  medication: 'bg-blue-100 text-blue-800',
  allergy: 'bg-red-100 text-red-800',
  surgery: 'bg-purple-100 text-purple-800',
  
  // Container colors
  'container-red': 'bg-red-500 text-white',
  'container-yellow': 'bg-yellow-400 text-gray-900',
  'container-purple': 'bg-purple-500 text-white',
  'container-blue': 'bg-blue-500 text-white',
  'container-green': 'bg-green-500 text-white',
  'container-gray': 'bg-gray-500 text-white',
  'container-black': 'bg-gray-900 text-white',
  
  // Payment methods
  cash: 'bg-green-100 text-green-800',
  'credit-card': 'bg-blue-100 text-blue-800',
  'debit-card': 'bg-indigo-100 text-indigo-800',
  insurance: 'bg-purple-100 text-purple-800',
  'bank-transfer': 'bg-cyan-100 text-cyan-800',
  'mobile-money': 'bg-teal-100 text-teal-800',
  
  // User roles
  receptionist: 'bg-blue-100 text-blue-800',
  'lab-technician': 'bg-green-100 text-green-800',
  pathologist: 'bg-purple-100 text-purple-800',
  administrator: 'bg-red-100 text-red-800',
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
