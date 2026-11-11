/**
 * Table/currency presentation wrappers around `@/utils/currency`.
 */

import { formatCurrency } from '@/utils/currency';

export { formatCurrency };

export function formatTableAmount(amount: number): string {
  return formatCurrency(amount);
}
