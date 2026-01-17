/**
 * Order Constants (non-enum values only)
 *
 * For enum values (OrderStatus, PaymentStatus, PriorityLevel, TestStatus),
 * import from '@/types' or '@/types/enums'
 */

/**
 * Status Timeline Steps - UI-specific workflow representation
 * This includes 'collected' which is determined by TestStatus, not OrderStatus
 * Used by StatusTimeline component to show order progress
 */
export const STATUS_TIMELINE_STEPS = [
  { status: 'ordered', label: 'Ordered' },
  { status: 'collected', label: 'Collected' },
  { status: 'in-progress', label: 'In Progress' },
  { status: 'completed', label: 'Completed' },
  { status: 'delivered', label: 'Delivered' },
] as const;
