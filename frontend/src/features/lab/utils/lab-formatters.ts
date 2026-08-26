/**
 * Lab Formatters
 * Pure formatting functions for lab data display
 */

import type { TestStatus } from '@/types';
import { getDisplayStatus, getTestStatusDisplayLabel, getTestStatusVariant, DISPLAY_STATUS_CONFIG } from '@/types/enums/test';

/**
 * Format rejection reasons for display
 */
export const formatRejectionReasons = (reasons: string[] | undefined): string | null => {
  if (!reasons || reasons.length === 0) return null;
  return reasons.map(r => r.replace(/_/g, ' ')).join(', ');
};

/**
 * Format test status for display using simplified status mapping
 */
export function formatTestStatus(status: TestStatus): string {
  return getTestStatusDisplayLabel(status);
}

/**
 * Get badge variant for test status
 */
export function getTestStatusBadgeVariant(status: TestStatus): string {
  return getTestStatusVariant(status);
}

/**
 * Get detailed status information including both display and internal status
 */
export function getStatusInfo(status: TestStatus) {
  const displayStatus = getDisplayStatus(status);
  return {
    displayStatus,
    displayLabel: DISPLAY_STATUS_CONFIG[displayStatus].label,
    variant: DISPLAY_STATUS_CONFIG[displayStatus].variant,
    internalStatus: status,
  };
}
