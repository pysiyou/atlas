/** GENERATED from contracts/enums.json. DO NOT EDIT. */
export const ORDER_STATUS_VALUES = ["ordered", "running", "completed", "cancelled"] as const;

export type OrderStatus = (typeof ORDER_STATUS_VALUES)[number];

export const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string }> = {
  "ordered": { label: "Ordered" },
  "running": { label: "Running" },
  "completed": { label: "Completed" },
  "cancelled": { label: "Cancelled" },
};

export const ORDER_STATUS_OPTIONS = ORDER_STATUS_VALUES.map(value => ({
  value,
  label: ORDER_STATUS_CONFIG[value].label,
}));

export const ORDER_STATUS_FILTER_OPTIONS = [
  { value: 'all' as const, label: "All Status" },
  ...ORDER_STATUS_OPTIONS,
];

export const ORDER_STATUS_TIMELINE = ORDER_STATUS_VALUES.map(status => ({
  status,
  label: ORDER_STATUS_CONFIG[status].label,
}));

export const PAYMENT_STATUS_VALUES = ["unpaid", "paid"] as const;

export type PaymentStatus = (typeof PAYMENT_STATUS_VALUES)[number];

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string }> = {
  "unpaid": { label: "Unpaid" },
  "paid": { label: "Paid" },
};

export const PAYMENT_STATUS_OPTIONS = PAYMENT_STATUS_VALUES.map(value => ({
  value,
  label: PAYMENT_STATUS_CONFIG[value].label,
}));

export const PAYMENT_STATUS_FILTER_OPTIONS = [
  { value: 'all' as const, label: "All Status" },
  ...PAYMENT_STATUS_OPTIONS,
];

export const PRIORITY_LEVEL_VALUES = ["low", "medium", "high", "urgent"] as const;

export type PriorityLevel = (typeof PRIORITY_LEVEL_VALUES)[number];

export const PRIORITY_LEVEL_CONFIG: Record<PriorityLevel, { label: string; turnaroundHours: number }> = {
  "low": { label: "Low", turnaroundHours: 48 },
  "medium": { label: "Medium", turnaroundHours: 24 },
  "high": { label: "High", turnaroundHours: 4 },
  "urgent": { label: "Urgent", turnaroundHours: 1 },
};

export const PRIORITY_LEVEL_OPTIONS = PRIORITY_LEVEL_VALUES.map(value => ({
  value,
  label: PRIORITY_LEVEL_CONFIG[value].label,
}));

export const PRIORITY_LEVEL_FILTER_OPTIONS = [
  { value: 'all' as const, label: "All Priorities" },
  ...PRIORITY_LEVEL_OPTIONS,
];

export const PAYMENT_METHOD_VALUES = ["cash", "credit-card", "debit-card", "insurance", "bank-transfer", "mobile"] as const;

export type PaymentMethod = (typeof PAYMENT_METHOD_VALUES)[number];

export const PAYMENT_METHOD_CONFIG: Record<PaymentMethod, { label: string; enabled: boolean; iconKey: string }> = {
  "cash": { label: "Cash", enabled: true, iconKey: "dataFields.cash" },
  "credit-card": { label: "Credit Card", enabled: false, iconKey: "dataFields.creditCard" },
  "debit-card": { label: "Debit Card", enabled: false, iconKey: "dataFields.creditCard" },
  "insurance": { label: "Insurance", enabled: false, iconKey: "ui.shield" },
  "bank-transfer": { label: "Bank Transfer", enabled: false, iconKey: "dataFields.wallet" },
  "mobile": { label: "Mobile", enabled: true, iconKey: "ui.smartphone" },
};

