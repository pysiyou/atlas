/**
 * Whether a reportable order is eligible for PDF download/print.
 */
import type { OrderStatus } from '@/types';
import type { ReportableOrder } from '@/types';

/** Resolve rollup status from list rows or hydrated detail payloads. */
export function getReportableOrderOverallStatus(
  order: ReportableOrder
): OrderStatus | undefined {
  return order.overallStatus ?? order.order?.overallStatus;
}

/** Print when at least one test is released. Partial orders include only validated lines. */
export function canPrintReport(order: ReportableOrder): boolean {
  if (getReportableOrderOverallStatus(order) === 'cancelled') return false;
  if ((order.validatedTestCount ?? 0) > 0) return true;
  return getReportableOrderOverallStatus(order) === 'completed';
}
