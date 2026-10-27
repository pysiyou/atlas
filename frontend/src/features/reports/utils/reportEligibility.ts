/**
 * Whether a reportable order is eligible for PDF download/print.
 */
import type { OrderStatus } from '@/types';
import type { ReportableOrder } from '../types';

/** Resolve rollup status from list rows or hydrated detail payloads. */
export function getReportableOrderOverallStatus(
  order: ReportableOrder
): OrderStatus | undefined {
  return order.overallStatus ?? order.order?.overallStatus;
}

/** Lab reports may only be printed when the order is completed. */
export function canPrintReport(order: ReportableOrder): boolean {
  return getReportableOrderOverallStatus(order) === 'completed';
}
