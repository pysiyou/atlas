/**
 * Dashboard table feed — order tests updated today (UTC), newest first.
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
