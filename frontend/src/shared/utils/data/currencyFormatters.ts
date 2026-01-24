/**
 * Currency Formatting Utilities
 * Consolidated currency formatting functions
 */

/**
 * Format a number as currency (USD)
 * @param amount - Number to format
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}
