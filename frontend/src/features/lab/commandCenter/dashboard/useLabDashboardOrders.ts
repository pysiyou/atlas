/**
 * Merges collection / entry / validation worklists into one dashboard table feed.
 */
import { useMemo } from 'react';
import { useTestNameLookup } from '@/features/catalog';
import {
  useCollectionWorklist,
  useDashboardBlockedWorklist,
  useEntryWorklist,
  useValidationWorklist,
} from '../../api/worklists';
import { mergeDashboardOrders } from './dashboardOrders';

export function useLabDashboardOrders() {
  const collection = useCollectionWorklist({ pageSize: 200 });
  const entry = useEntryWorklist({ pageSize: 200 });
  const validation = useValidationWorklist({ pageSize: 200 });
  const blocked = useDashboardBlockedWorklist({ pageSize: 200 });
  const { getTest, isLoading: catalogLoading } = useTestNameLookup();

  const rows = useMemo(
    () =>
      mergeDashboardOrders(
        collection.items,
        entry.items,
        validation.items,
        blocked.items,
        getTest,
      ),
    [collection.items, entry.items, validation.items, blocked.items, getTest],
  );

  return {
    rows,
    isLoading:
      collection.isLoading ||
      entry.isLoading ||
      validation.isLoading ||
      blocked.isLoading ||
      catalogLoading,
  };
}
