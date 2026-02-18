/**
 * Currency Formatting Utilities
 */

/**
 * Format a number as USD currency.
 * @example formatCurrency(9.99) // '$9.99'
 */
export function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return '$0.00';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}
