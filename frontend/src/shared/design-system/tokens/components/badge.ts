/**
 * Badge Component Tokens
 * 
 * Comprehensive badge styling tokens for all 100+ variants.
 * Semantic colors MUST match Alert component exactly.
 */

import { semanticColors } from '../colors';
import { padding } from '../spacing';
import { radius } from '../borders';

/**
 * Badge Base Styles
 */
export const badgeBase = {
  base: 'inline-flex items-center font-medium border transition-colors whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-offset-2',
  rounded: 'rounded-sm',
} as const;

/**
 * Badge Sizes
 */
export const badgeSizes = {
  xs: {
    padding: 'px-1.5 py-0.5',
    text: 'text-xxs',
  },
  sm: {
    padding: 'px-2 py-0.5',
    text: 'text-xs',
  },
  md: {
    padding: 'px-2.5 py-0.5',
    text: 'text-sm',
  },
} as const;

/**
 * Semantic Variants
 * MUST match Alert component semantic colors exactly
 */
export const semanticVariants = {
  success: {
    base: `${semanticColors.success.backgroundLight} ${semanticColors.success.textLight} border-transparent`,
  },
  danger: {
    base: `${semanticColors.danger.backgroundLight} ${semanticColors.danger.textLight} border-transparent`,
  },
  error: {
    base: `${semanticColors.danger.backgroundLight} ${semanticColors.danger.textLight} border-transparent`,
  },
  warning: {
    base: `${semanticColors.warning.backgroundLight} ${semanticColors.warning.textLight} border-transparent`,
  },
  info: {
    base: `${semanticColors.info.backgroundLight} ${semanticColors.info.textLight} border-transparent`,
  },
} as const;

/**
 * Base Variants
 */
export const baseVariants = {
  default: 'bg-gray-100 text-gray-800 border-transparent',
  primary: 'bg-sky-100 text-sky-800 border-transparent',
  secondary: 'bg-gray-100 text-gray-800 border-transparent',
  outline: 'text-gray-800 border-gray-200 bg-transparent',
  ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 border-transparent',
  neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  purple: 'bg-purple-100 text-purple-800 border-transparent',
  orange: 'bg-orange-100 text-orange-800 border-transparent',
  teal: 'bg-teal-100 text-teal-800 border-transparent',
} as const;

/**
 * Order Status Variants
 */
export const orderStatusVariants = {
  ordered: 'bg-sky-100 text-sky-800 border-transparent',
  'in-progress': 'bg-yellow-100 text-yellow-800 border-transparent',
  completed: semanticVariants.success.base,
  cancelled: semanticVariants.danger.base,
  validated: semanticVariants.success.base,
  rejected: semanticVariants.danger.base,
  superseded: 'bg-slate-200 text-slate-600 border-transparent line-through',
  removed: 'bg-gray-100 text-gray-500 border-transparent line-through',
} as const;

/**
 * Test Status Variants
 */
export const testStatusVariants = {
  resulted: 'bg-purple-100 text-purple-800 border-transparent',
} as const;

/**
 * Critical Value Variants
 */
export const criticalVariants = {
  critical: 'bg-red-600 text-white border-transparent font-bold',
  'critical-high': 'bg-red-600 text-white border-transparent font-bold',
  'critical-low': 'bg-red-600 text-white border-transparent font-bold',
  high: 'bg-orange-100 text-orange-800 border-transparent',
  low: 'bg-blue-100 text-blue-800 border-transparent',
  normal: semanticVariants.success.base,
} as const;

/**
 * Rejection Type Variants
 */
export const rejectionVariants = {
  're-test': 'bg-amber-100 text-amber-800 border-transparent',
  're-collect': 'bg-orange-100 text-orange-800 border-transparent',
} as const;

/**
 * Sample Status Variants
 */
export const sampleStatusVariants = {
  pending: 'bg-yellow-100 text-yellow-800 border-transparent',
  collected: semanticVariants.success.base,
  received: 'bg-sky-100 text-sky-800 border-transparent',
  accessioned: 'bg-indigo-100 text-indigo-800 border-transparent',
  stored: 'bg-gray-100 text-gray-800 border-transparent',
  disposed: 'bg-gray-200 text-gray-800 border-transparent',
  'sample-collected': 'bg-teal-100 text-teal-800 border-transparent',
} as const;

/**
 * Appointment Status Variants
 */
export const appointmentStatusVariants = {
  scheduled: 'bg-sky-100 text-sky-800 border-transparent',
  confirmed: semanticVariants.success.base,
  'no-show': 'bg-orange-100 text-orange-800 border-transparent',
} as const;

/**
 * Payment Status Variants
 */
export const paymentStatusVariants = {
  partial: 'bg-orange-100 text-orange-800 border-transparent',
  paid: semanticVariants.success.base,
  unpaid: semanticVariants.danger.base,
} as const;

/**
 * Priority Variants
 */
export const priorityVariants = {
  routine: 'bg-sky-100 text-sky-800 border-transparent',
  urgent: 'bg-orange-100 text-orange-800 border-transparent',
  stat: 'bg-red-100 text-red-800 border-transparent font-bold',
} as const;

/**
 * Sample Type Variants
 */
export const sampleTypeVariants = {
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
} as const;

/**
 * Test Category Variants
 */
export const testCategoryVariants = {
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
} as const;

/**
 * Sex/Gender Variants
 */
export const sexVariants = {
  male: 'bg-sky-50 text-sky-700 border-transparent',
  female: 'bg-pink-50 text-pink-700 border-transparent',
} as const;

/**
 * Medical History Variants
 */
export const medicalHistoryVariants = {
  'chronic-condition': 'bg-sky-50 text-sky-700 border-transparent',
  medication: 'bg-green-50 text-green-700 border-transparent',
  allergy: 'bg-orange-50 text-orange-700 border-transparent',
  surgery: 'bg-purple-50 text-purple-700 border-transparent',
} as const;

/**
 * Container Color Variants (solid colors for physical tube representation)
 */
export const containerColorVariants = {
  'container-red': 'bg-red-500 text-white border-transparent',
  'container-yellow': 'bg-yellow-500 text-white border-transparent',
  'container-purple': 'bg-purple-500 text-white border-transparent',
  'container-blue': 'bg-sky-500 text-white border-transparent',
  'container-green': 'bg-green-500 text-white border-transparent',
  'container-gray': 'bg-gray-500 text-white border-transparent',
  'container-black': 'bg-black text-white border-transparent',
} as const;

/**
 * Payment Method Variants
 */
export const paymentMethodVariants = {
  cash: 'bg-emerald-100 text-emerald-800 border-transparent',
  'credit-card': 'bg-sky-100 text-sky-800 border-transparent',
  'debit-card': 'bg-sky-100 text-sky-800 border-transparent',
  insurance: 'bg-purple-100 text-purple-800 border-transparent',
  'bank-transfer': 'bg-indigo-100 text-indigo-800 border-transparent',
  'mobile-money': 'bg-orange-100 text-orange-800 border-transparent',
} as const;

/**
 * User Role Variants
 */
export const userRoleVariants = {
  receptionist: 'bg-sky-100 text-sky-800 border-transparent',
  'lab-technician': semanticVariants.success.base,
  pathologist: 'bg-purple-100 text-purple-800 border-transparent',
  administrator: semanticVariants.danger.base,
} as const;

/**
 * Complete Badge Variant Map
 * Combines all variant categories for easy lookup
 */
export const badgeVariants = {
  // Base variants
  ...baseVariants,
  // Semantic variants (must match Alert)
  ...semanticVariants,
  // Domain-specific variants
  ...orderStatusVariants,
  ...testStatusVariants,
  ...criticalVariants,
  ...rejectionVariants,
  ...sampleStatusVariants,
  ...appointmentStatusVariants,
  ...paymentStatusVariants,
  ...priorityVariants,
  ...sampleTypeVariants,
  ...testCategoryVariants,
  ...sexVariants,
  ...medicalHistoryVariants,
  ...containerColorVariants,
  ...paymentMethodVariants,
  ...userRoleVariants,
} as const;

/**
 * Helper function to get badge variant classes
 */
export const getBadgeVariant = (variant: string): string => {
  const normalized = variant.toLowerCase();
  return badgeVariants[normalized as keyof typeof badgeVariants] || badgeVariants.default;
};

/**
 * Helper function to get badge size classes
 */
export const getBadgeSize = (size: keyof typeof badgeSizes): string => {
  return `${badgeSizes[size].padding} ${badgeSizes[size].text}`;
};

/**
 * Helper function to get complete badge classes
 */
export const getBadgeClasses = (
  variant: string,
  size: keyof typeof badgeSizes = 'md'
): string => {
  return `${badgeBase.base} ${getBadgeVariant(variant)} ${getBadgeSize(size)} ${badgeBase.rounded}`;
};
