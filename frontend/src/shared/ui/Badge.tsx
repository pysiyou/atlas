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

// Maps specific domain keys (status, priority, etc.) to base visual styles
const VARIANT_STYLES: Record<string, string> = {
  // Base Colors
  default: 'bg-gray-100 text-gray-800 border-transparent',
  primary: 'bg-sky-100 text-sky-800 border-transparent',
  secondary: 'bg-gray-100 text-gray-800 border-transparent', // Same as default for now
  outline: 'text-gray-800 border-gray-200 bg-transparent',
  ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 border-transparent',
  neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  danger: 'bg-red-100 text-red-800 border-transparent',
  error: 'bg-red-100 text-red-800 border-transparent',
  success: 'bg-green-100 text-green-800 border-transparent',
  warning: 'bg-yellow-100 text-yellow-800 border-transparent',
  info: 'bg-sky-100 text-sky-800 border-transparent',
  purple: 'bg-purple-100 text-purple-800 border-transparent',
  orange: 'bg-orange-100 text-orange-800 border-transparent',
  teal: 'bg-teal-100 text-teal-800 border-transparent',

  // Order Status Mappings
  ordered: 'bg-sky-100 text-sky-800 border-transparent',
  'in-progress': 'bg-yellow-100 text-yellow-800 border-transparent',
  completed: 'bg-green-100 text-green-800 border-transparent',
  cancelled: 'bg-red-100 text-red-800 border-transparent',
  validated: 'bg-green-100 text-green-800 border-transparent',
  rejected: 'bg-red-100 text-red-800 border-transparent',
  superseded: 'bg-slate-200 text-slate-600 border-transparent line-through', // Grayed out, struck-through for replaced tests
  removed: 'bg-gray-100 text-gray-500 border-transparent line-through', // Grayed out, struck-through for removed tests

  // Test Status Mappings
  resulted: 'bg-purple-100 text-purple-800 border-transparent', // Results entered, awaiting validation

  // Critical Value Mappings (for result flags)
  critical: 'bg-red-600 text-white border-transparent font-bold',
  'critical-high': 'bg-red-600 text-white border-transparent font-bold',
  'critical-low': 'bg-red-600 text-white border-transparent font-bold',
  high: 'bg-orange-100 text-orange-800 border-transparent',
  low: 'bg-blue-100 text-blue-800 border-transparent',
  normal: 'bg-green-100 text-green-800 border-transparent',

  // Rejection Type Mappings
  're-test': 'bg-amber-100 text-amber-800 border-transparent',
  're-collect': 'bg-orange-100 text-orange-800 border-transparent',

  // Sample Status Mappings
  pending: 'bg-yellow-100 text-yellow-800 border-transparent',
  collected: 'bg-green-100 text-green-800 border-transparent',
  received: 'bg-sky-100 text-sky-800 border-transparent',
  accessioned: 'bg-indigo-100 text-indigo-800 border-transparent',
  stored: 'bg-gray-100 text-gray-800 border-transparent',
  disposed: 'bg-gray-200 text-gray-800 border-transparent',
  'sample-collected': 'bg-teal-100 text-teal-800 border-transparent',

  // Appointment Status Mappings
  scheduled: 'bg-sky-100 text-sky-800 border-transparent',
  confirmed: 'bg-green-100 text-green-800 border-transparent',
  'no-show': 'bg-orange-100 text-orange-800 border-transparent',

  // Payment Status Mappings
  partial: 'bg-orange-100 text-orange-800 border-transparent',
  paid: 'bg-green-100 text-green-800 border-transparent',
  unpaid: 'bg-red-100 text-red-800 border-transparent',

  // Priority Mappings
  routine: 'bg-sky-100 text-sky-800 border-transparent',
  urgent: 'bg-orange-100 text-orange-800 border-transparent',
  stat: 'bg-red-100 text-red-800 border-transparent font-bold',

  // Sample Type Mappings
  blood: 'bg-red-100 text-red-800 border-transparent',
  plasma: 'bg-emerald-100 text-emerald-800 border-transparent',
  serum: 'bg-amber-100 text-amber-800 border-transparent',
  urine: 'bg-yellow-100 text-yellow-800 border-transparent',
  stool: 'bg-orange-100 text-orange-800 border-transparent',
  swab: 'bg-teal-100 text-teal-800 border-transparent',
  tissue: 'bg-purple-100 text-purple-800 border-transparent',
  csf: 'bg-sky-100 text-sky-800 border-transparent',
  sputum: 'bg-gray-100 text-gray-800 border-transparent',
  fluid: 'bg-cyan-100 text-cyan-800 border-transparent',
  other: 'bg-gray-100 text-gray-800 border-transparent',
  unknown: 'bg-gray-100 text-gray-800 border-transparent',

  // Test Category Mappings
  hematology: 'bg-pink-100 text-pink-800 border-transparent',
  biochemistry: 'bg-sky-100 text-sky-800 border-transparent',
  chemistry: 'bg-sky-100 text-sky-800 border-transparent',
  microbiology: 'bg-emerald-100 text-emerald-800 border-transparent',
  serology: 'bg-purple-100 text-purple-800 border-transparent',
  urinalysis: 'bg-yellow-100 text-yellow-800 border-transparent',
  imaging: 'bg-gray-100 text-gray-800 border-transparent',
  immunology: 'bg-indigo-100 text-indigo-800 border-transparent',
  molecular: 'bg-cyan-100 text-cyan-800 border-transparent',
  toxicology: 'bg-red-100 text-red-800 border-transparent',
  coagulation: 'bg-rose-100 text-rose-800 border-transparent',

  // Sex Mappings
  male: 'bg-sky-50 text-sky-700 border-transparent',
  female: 'bg-pink-50 text-pink-700 border-transparent',

  // Medical History Mappings
  'chronic-condition': 'bg-sky-50 text-sky-700 border-transparent',
  medication: 'bg-green-50 text-green-700 border-transparent',
  allergy: 'bg-orange-50 text-orange-700 border-transparent',
  surgery: 'bg-purple-50 text-purple-700 border-transparent',

  // Container Top Color Mappings (solid colors for physical tube representation)
  'container-red': 'bg-red-500 text-white border-transparent',
  'container-yellow': 'bg-yellow-500 text-white border-transparent',
  'container-purple': 'bg-purple-500 text-white border-transparent',
  'container-blue': 'bg-sky-500 text-white border-transparent',
  'container-green': 'bg-green-500 text-white border-transparent',
  'container-gray': 'bg-gray-500 text-white border-transparent',
  'container-black': 'bg-black text-white border-transparent',

  // Payment Method Mappings
  cash: 'bg-emerald-100 text-emerald-800 border-transparent',
  'credit-card': 'bg-sky-100 text-sky-800 border-transparent',
  'debit-card': 'bg-sky-100 text-sky-800 border-transparent',
  insurance: 'bg-purple-100 text-purple-800 border-transparent',
  'bank-transfer': 'bg-indigo-100 text-indigo-800 border-transparent',
  'mobile-money': 'bg-orange-100 text-orange-800 border-transparent',

  // User Role Mappings
  receptionist: 'bg-sky-100 text-sky-800 border-transparent',
  'lab-technician': 'bg-green-100 text-green-800 border-transparent',
  pathologist: 'bg-purple-100 text-purple-800 border-transparent',
  administrator: 'bg-red-100 text-red-800 border-transparent',
};

const SIZES = {
  xs: 'px-1.5 py-0.5 text-xxs',
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-sm',
};

// Custom display labels for variants (shorter/abbreviated versions)
const VARIANT_LABELS: Record<string, string> = {
  'sample-collected': 'COLLECTED',
  'in-progress': 'IN PROGRESS',
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
  const variantClass = VARIANT_STYLES[normalizedVariant] || VARIANT_STYLES['default'];

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
        'inline-flex items-center font-medium rounded-sm border transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
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
