/**
 * CategorySummary - Test volume breakdown by catalog category.
 */

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@/components/primitives/Icon';
import { Skeleton } from '@/components/loaders/Skeleton';
import { getCategoryLabel } from '@/features/catalog/constants/catalogConfig';
import { ICONS } from '@/config/icons';
import { queryKeys } from '@/lib/query/keys';
import { getCategoryBarColorClass } from '@/components/theme';
import { cn } from '@/utils';
import {
  monitoringAPI,
  type CategorySummaryDays,
  type CategorySummaryItem,
} from '../api/monitoring.api';
import {
  CommandCenterPanel,
  CommandCenterPanelEmpty,
  CommandCenterPanelError,
  SegmentedBar,
} from './commandCenterShared';
import { COMMAND_CENTER_PANEL, COMMAND_CENTER_SELECT } from './commandCenterStyles';

const TIME_RANGE_OPTIONS: { label: string; days: CategorySummaryDays }[] = [
  { label: '1 week', days: 7 },
  { label: '1 month', days: 30 },
  { label: '3 months', days: 90 },
];

function useCategorySummaryQuery(days: CategorySummaryDays) {
  return useQuery({
    queryKey: queryKeys.monitoring.categorySummary(days),
    queryFn: async () => {
      const result = await monitoringAPI.getCategorySummary(days);
      if (!result) throw new Error('No data returned from category summary endpoint');
      return result;
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}

function TimeRangeSelect({
  value,
  onChange,
}: {
  value: CategorySummaryDays;
  onChange: (days: CategorySummaryDays) => void;
}) {
  return (
    <div className="relative ml-auto shrink-0">
      <select
        value={value}
        onChange={event => onChange(Number(event.target.value) as CategorySummaryDays)}
        className={COMMAND_CENTER_SELECT.base}
        aria-label="Category summary time range"
      >
        {TIME_RANGE_OPTIONS.map(option => (
          <option key={option.days} value={option.days}>
            {option.label}
          </option>
        ))}
      </select>
      <Icon name={ICONS.actions.chevronDown} className={COMMAND_CENTER_SELECT.chevron} aria-hidden />
    </div>
  );
}

function CategoryLegend({ categories }: { categories: CategorySummaryItem[] }) {
  return (
    <ul className="space-y-2">
      {categories.map((item, index) => (
        <li key={item.category} className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={cn('h-3 w-3 shrink-0 rounded', getCategoryBarColorClass(item.category, index))}
              aria-hidden
            />
            <span className="truncate text-xs text-text-primary">{getCategoryLabel(item.category)}</span>
          </div>
          <span className="shrink-0 text-xs tabular-nums text-text-secondary">{item.percentage}%</span>
        </li>
      ))}
    </ul>
  );
}

export const CategorySummary: React.FC = () => {
  const [days, setDays] = useState<CategorySummaryDays>(90);
  const { data, isLoading, isError, refetch } = useCategorySummaryQuery(days);

  const total = data?.total ?? 0;
  const categories = useMemo(() => data?.categories ?? [], [data?.categories]);

  const segments = useMemo(
    () =>
      categories.map((item, index) => ({
        key: item.category,
        percentage: item.percentage,
        colorClass: getCategoryBarColorClass(item.category, index),
        title: `${getCategoryLabel(item.category)} ${item.percentage}%`,
      })),
    [categories],
  );

  return (
    <CommandCenterPanel
      title="Category"
      headerActions={<TimeRangeSelect value={days} onChange={setDays} />}
    >
      <div className={COMMAND_CENTER_PANEL.bodyScroll}>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-5 w-full" />
            <div className="space-y-2 pt-1">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-4 w-full" />
              ))}
            </div>
          </div>
        ) : isError ? (
          <CommandCenterPanelError
            message="Unable to load category summary."
            onRetry={() => void refetch()}
          />
        ) : total === 0 ? (
          <CommandCenterPanelEmpty message="No tests in this period." />
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline gap-1.5">
                <p className="text-2xl font-semibold tabular-nums text-text-primary">{total}</p>
                <span className="text-sm text-text-secondary">tests</span>
              </div>
              <SegmentedBar segments={segments} ariaLabel="Test category distribution" />
            </div>
            <CategoryLegend categories={categories} />
          </div>
        )}
      </div>
    </CommandCenterPanel>
  );
};
