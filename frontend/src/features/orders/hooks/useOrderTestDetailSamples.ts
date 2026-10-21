/**
 * Fetches order-scoped samples when the order test detail modal is open.
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sampleAPI } from '@/features/lab/cross';
import { queryKeys, cacheConfig } from '@/lib/query';
import type { OrderTest, Sample } from '@/types';
import { getRelatedSamplesForOrderTest } from '../utils/orderTestDetailSamples';

export function useOrderTestDetailSamples(
  orderId: number,
  orderTest: OrderTest,
  isOpen: boolean
): { relatedSamples: Sample[]; isLoading: boolean } {
  const { data: orderSamples = [], isLoading } = useQuery({
    queryKey: queryKeys.samples.byOrder(String(orderId)),
    queryFn: () => sampleAPI.getAll({ orderId: String(orderId) }),
    enabled: isOpen && orderId > 0,
    ...cacheConfig.dynamic,
  });

  const linkedId = orderTest.sampleId;

  const { data: fetchedLinked } = useQuery({
    queryKey: queryKeys.samples.byId(linkedId != null ? String(linkedId) : ''),
    queryFn: () => sampleAPI.getById(String(linkedId!)),
    enabled: isOpen && linkedId != null && !orderSamples.some(s => s.sampleId === linkedId),
    ...cacheConfig.dynamic,
  });

  const mergedSamples = useMemo(() => {
    const list = [...orderSamples];
    if (fetchedLinked && !list.some(s => s.sampleId === fetchedLinked.sampleId)) {
      list.push(fetchedLinked);
    }
    return list;
  }, [orderSamples, fetchedLinked]);

  const relatedSamples = useMemo(
    () => getRelatedSamplesForOrderTest(orderTest, mergedSamples),
    [orderTest, mergedSamples]
  );

  return { relatedSamples, isLoading };
}
