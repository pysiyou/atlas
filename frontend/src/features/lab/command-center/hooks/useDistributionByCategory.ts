/**
 * useDistributionByCategory - Validated tests count by category (this year).
 * For DistributionPieChart: aggregates order tests with status validated and resultValidatedAt in current year.
 */

import { useMemo } from 'react';
import { useOrdersList } from '@/hooks/queries';
import { useTestCatalog } from '@/hooks/queries';
import { isActiveTest } from '@/utils/orderUtils';
import type { OrderTest } from '@/types';

export interface DistributionByCategoryPoint {
  name: string;
  value: number;
}

function getResultValidatedAt(t: OrderTest & { result_validated_at?: string }): string | undefined {
  return t.resultValidatedAt ?? t.result_validated_at;
}

function isThisYear(iso: string | undefined): boolean {
  if (!iso || typeof iso !== 'string') return false;
  const year = iso.split('-')[0];
  return year === String(new Date().getFullYear());
}

/** Capitalize first letter for display (e.g. hematology -> Hematology). */
function displayCategory(category: string): string {
  if (!category) return 'Other';
  return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
}

export function useDistributionByCategory(): {
  data: DistributionByCategoryPoint[];
  isLoading: boolean;
} {
  const { orders, isLoading: ordersLoading } = useOrdersList();
  const { tests: catalogTests, isLoading: catalogLoading } = useTestCatalog();
  const isLoading = ordersLoading || catalogLoading;

  const data = useMemo((): DistributionByCategoryPoint[] => {
    const codeToCategory = new Map<string, string>();
    catalogTests.forEach((t) => {
      if (t.code && t.category) codeToCategory.set(t.code, t.category);
    });

    const countByCategory = new Map<string, number>();
    (orders ?? []).forEach((order) => {
      (order.tests ?? []).forEach((test) => {
        if (!isActiveTest(test)) return;
        if (test.status !== 'validated') return;
        const validatedAt = getResultValidatedAt(test);
        if (!isThisYear(validatedAt)) return;
        const category = codeToCategory.get(test.testCode) ?? 'Other';
        const display = displayCategory(category);
        countByCategory.set(display, (countByCategory.get(display) ?? 0) + 1);
      });
    });

    return Array.from(countByCategory.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [orders, catalogTests]);

  return { data, isLoading };
}
