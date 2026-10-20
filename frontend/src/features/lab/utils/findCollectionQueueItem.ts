/**
 * Resolve a collection queue row from the worklist query cache by sample id.
 */

import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query';
import type { SampleCollectionQueueItem } from '@/types/lab-operations';
import type { CollectionWorklistItem } from '../api/worklists';
import { mapCollectionWorklistToSampleDisplay } from './worklistMappers';

/**
 * Walk cached collection worklists and return the matching display row, if any.
 */
export function findCollectionQueueItem(
  queryClient: QueryClient,
  sampleId: number
): SampleCollectionQueueItem | undefined {
  if (!Number.isFinite(sampleId)) return undefined;

  const queries = queryClient.getQueriesData<{ items?: CollectionWorklistItem[] }>({
    queryKey: queryKeys.worklists.all,
  });

  for (const [key, data] of queries) {
    const isCollection = Array.isArray(key) && key[1] === 'collection';
    if (!isCollection) continue;
    const item = data?.items?.find(row => row.sampleId === sampleId);
    if (item) return mapCollectionWorklistToSampleDisplay(item);
  }

  return undefined;
}
