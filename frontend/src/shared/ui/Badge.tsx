import React from 'react';
import { cn } from '@/utils';
import { Icon } from './Icon';
import type { IconName } from './Icon';
import { getBadgeVariant, getBadgeSize, badgeBase } from '@/shared/design-system/tokens/components/badge';

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

// NOTE: VARIANT_STYLES removed - now using getBadgeVariant() from design tokens
// All variants are defined in src/shared/design-system/tokens/components/badge.ts

// Size classes - uses design tokens
const SIZES = {
  xs: getBadgeSize('xs'),
  sm: getBadgeSize('sm'),
  md: getBadgeSize('md'),
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

  // Lookup style or fallback to default - uses design tokens
  const variantClass = getBadgeVariant(normalizedVariant);

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
        badgeBase.base,
        badgeBase.rounded,
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
