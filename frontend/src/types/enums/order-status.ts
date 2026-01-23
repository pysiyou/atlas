/**
 * Order Status - Single Source of Truth
 *
 * Note: Badge colors for order status are defined in the Badge component.
 * Use the status value directly as the Badge variant (e.g., variant="ordered").
 */

// 1. VALUES - The single source of truth
export const ORDER_STATUS_VALUES = ['ordered', 'in-progress', 'completed', 'cancelled'] as const;

// 2. TYPE - Derived from values
export type OrderStatus = (typeof ORDER_STATUS_VALUES)[number];

// 3. CONFIG - Metadata for each value (label only, colors handled by Badge)
export const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string }> = {
  ordered: { label: 'Ordered' },
  'in-progress': { label: 'In Progress' },
  completed: { label: 'Completed' },
  cancelled: { label: 'Cancelled' },
};

// 4. OPTIONS - For dropdowns/selects
export const ORDER_STATUS_OPTIONS = ORDER_STATUS_VALUES.map(value => ({
  value,
  label: ORDER_STATUS_CONFIG[value].label,
}));

// 5. FILTER OPTIONS - With "all" option
export const ORDER_STATUS_FILTER_OPTIONS = [
  { value: 'all' as const, label: 'All Status' },
  ...ORDER_STATUS_OPTIONS,
];

// 6. TIMELINE STEPS - For status progression display
export const ORDER_STATUS_TIMELINE = ORDER_STATUS_VALUES.map(status => ({
  status,
  label: ORDER_STATUS_CONFIG[status].label,
}));
