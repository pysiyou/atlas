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
 *
 * NOTE: The canonical definition is in ./utils.ts - this is kept for backward compatibility
 */
export const STATUS_TIMELINE_STEPS = [
  { status: 'created', label: 'Order Created' },
  { status: 'paid', label: 'Payment Received' },
  { status: 'sample-collected', label: 'Sample Collected' },
  { status: 'results-entered', label: 'Results Entered' },
  { status: 'completed', label: 'Completed' },
] as const;
