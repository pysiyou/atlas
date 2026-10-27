/**
 * Resolves test display names from order summary fields with optional catalog fallback.
 */
import type { Order } from '@/types';

type OrderTestLabels = Pick<Order, 'testCodes' | 'testNames'>;

/**
 * Returns a per-code name resolver using server `testNames` when aligned with `testCodes`.
 */
export function createOrderTestNameResolver(
  order: OrderTestLabels,
  catalogLookup?: (testCode: string) => string
): (testCode: string) => string {
  const codes = order.testCodes ?? [];
  const names = order.testNames ?? [];

  return (testCode: string) => {
    const index = codes.indexOf(testCode);
    if (index >= 0 && names[index]) {
      return names[index]!;
    }
    const fromCatalog = catalogLookup?.(testCode);
    if (fromCatalog) {
      return fromCatalog;
    }
    return testCode;
  };
}
