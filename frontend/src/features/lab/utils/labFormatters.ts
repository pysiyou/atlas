/**
 * Lab Formatters
 * Pure formatting functions for lab data display
 */

/**
 * Format rejection reasons for display
 */
export const formatRejectionReasons = (reasons: string[] | undefined): string | null => {
  if (!reasons || reasons.length === 0) return null;
  return reasons.map(r => r.replace(/_/g, ' ')).join(', ');
};
