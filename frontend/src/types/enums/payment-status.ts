/**
 * Payment Status - Single Source of Truth
 * 
 * Note: Badge colors for payment status are defined in the Badge component.
 * Use the status value directly as the Badge variant (e.g., variant="paid").
 */

// 1. VALUES - The single source of truth
export const PAYMENT_STATUS_VALUES = ['unpaid', 'paid'] as const;

// 2. TYPE - Derived from values
export type PaymentStatus = (typeof PAYMENT_STATUS_VALUES)[number];

// 3. CONFIG - Metadata for each value (label only, colors handled by Badge)
export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string }> = {
  unpaid: { label: 'Unpaid' },
  paid: { label: 'Paid' },
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
