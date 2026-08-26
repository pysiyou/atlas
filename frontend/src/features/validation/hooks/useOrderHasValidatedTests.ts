/**
 * Whether an order already has validated tests (blocks sample recollection during validation reject).
 */

import { useMemo } from 'react';
import { useOrderLookup } from '@/features/orders/utils/useOrderUtils';
import { orderHasValidatedTests } from '@/features/orders/utils';

export function useOrderHasValidatedTests(orderId: number | string): boolean {
  const { getOrder } = useOrderLookup();

  return useMemo(() => {
    const order = getOrder(orderId);
    return order ? orderHasValidatedTests(order) : false;
  }, [getOrder, orderId]);
}
