/**
 * Dashboard table feed — in-pipeline tests plus rows updated today.
 */
import { useMemo } from 'react';
import { useDashboardWorklistToday } from '../../api/worklists';
import { mapDashboardWorkToday, type LabDashboardOrderRow } from './dashboardOrders';

export function useLabDashboardOrders(): {
  rows: LabDashboardOrderRow[];
  isLoading: boolean;
} {
  const workToday = useDashboardWorklistToday({ pageSize: 200 });

  const rows = useMemo(
    () => workToday.items.map(mapDashboardWorkToday),
    [workToday.items],
  );

  return {
    rows,
    isLoading: workToday.isLoading,
  };
}
