/**
 * Payment Status - Single Source of Truth
 */

// 1. VALUES - The single source of truth
export const PAYMENT_STATUS_VALUES = ['pending', 'partial', 'paid'] as const;

// 2. TYPE - Derived from values
export type PaymentStatus = (typeof PAYMENT_STATUS_VALUES)[number];

// 3. CONFIG - Metadata for each value
export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; color: string }> = {
  pending: { label: 'Unpaid', color: 'warning' },
  partial: { label: 'Partial', color: 'info' },
  paid: { label: 'Paid', color: 'success' },
};

// 4. OPTIONS - For dropdowns/selects
export const PAYMENT_STATUS_OPTIONS = PAYMENT_STATUS_VALUES.map((value) => ({
  value,
  label: PAYMENT_STATUS_CONFIG[value].label,
}));

// 5. FILTER OPTIONS - With "all" option
export const PAYMENT_STATUS_FILTER_OPTIONS = [
  { value: 'all' as const, label: 'All Payment' },
  ...PAYMENT_STATUS_OPTIONS,
];
