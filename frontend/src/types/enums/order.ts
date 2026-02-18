export const ORDER_STATUS_VALUES = ['ordered', 'in-progress', 'completed', 'cancelled'] as const;

export type OrderStatus = (typeof ORDER_STATUS_VALUES)[number];

export const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string }> = {
  ordered: { label: 'Ordered' },
  'in-progress': { label: 'In Progress' },
  completed: { label: 'Completed' },
  cancelled: { label: 'Cancelled' },
};

export const ORDER_STATUS_OPTIONS = ORDER_STATUS_VALUES.map(value => ({
  value,
  label: ORDER_STATUS_CONFIG[value].label,
}));

export const ORDER_STATUS_FILTER_OPTIONS = [
  { value: 'all' as const, label: 'All Status' },
  ...ORDER_STATUS_OPTIONS,
];

export const ORDER_STATUS_TIMELINE = ORDER_STATUS_VALUES.map(status => ({
  status,
  label: ORDER_STATUS_CONFIG[status].label,
}));

export const PAYMENT_STATUS_VALUES = [
  'unpaid',
  'pending',
  'partial',
  'paid',
  'refunded',
  'cancelled',
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUS_VALUES)[number];

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string }> = {
  unpaid: { label: 'Unpaid' },
  pending: { label: 'Pending' },
  partial: { label: 'Partial' },
  paid: { label: 'Paid' },
  refunded: { label: 'Refunded' },
  cancelled: { label: 'Cancelled' },
};

export const PAYMENT_STATUS_OPTIONS = PAYMENT_STATUS_VALUES.map(value => ({
  value,
  label: PAYMENT_STATUS_CONFIG[value].label,
}));

export const PAYMENT_STATUS_FILTER_OPTIONS = [
  { value: 'all' as const, label: 'All Status' },
  ...PAYMENT_STATUS_OPTIONS,
];

export const PRIORITY_LEVEL_VALUES = ['low', 'medium', 'high', 'urgent'] as const;

export type PriorityLevel = (typeof PRIORITY_LEVEL_VALUES)[number];

export const PRIORITY_LEVEL_CONFIG: Record<
  PriorityLevel,
  { label: string; turnaroundHours: number }
> = {
  low: { label: 'Low', turnaroundHours: 48 },
  medium: { label: 'Medium', turnaroundHours: 24 },
  high: { label: 'High', turnaroundHours: 4 },
  urgent: { label: 'Urgent', turnaroundHours: 1 },
};

export const PRIORITY_LEVEL_OPTIONS = PRIORITY_LEVEL_VALUES.map(value => ({
  value,
  label: PRIORITY_LEVEL_CONFIG[value].label,
}));

export const PRIORITY_LEVEL_FILTER_OPTIONS = [
  { value: 'all' as const, label: 'All Priorities' },
  ...PRIORITY_LEVEL_OPTIONS,
];
