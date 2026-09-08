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
import { cn } from '@/utils';
import {
  monitoringAPI,
  type CategorySummaryDays,
  type CategorySummaryItem,
} from '../api/monitoring.api';

const TIME_RANGE_OPTIONS: { label: string; days: CategorySummaryDays }[] = [
  { label: '1 week', days: 7 },
  { label: '1 month', days: 30 },
  { label: '3 months', days: 90 },
];

const CATEGORY_BAR_COLORS: Record<string, string> = {
  hematology: 'bg-danger-fg-emphasis',
  biochemistry: 'bg-warning-fg-emphasis',
  chemistry: 'bg-orange-fg-emphasis',
  microbiology: 'bg-teal-fg-emphasis',
  serology: 'bg-indigo-fg-emphasis',
  urinalysis: 'bg-cyan-fg-emphasis',
  imaging: 'bg-purple-fg-emphasis',
  immunology: 'bg-pink-fg-emphasis',
  molecular: 'bg-brand',
  toxicology: 'bg-orange-fg-emphasis',
  coagulation: 'bg-danger-fg-emphasis',
};

const FALLBACK_BAR_COLORS = [
  'bg-brand',
  'bg-teal-fg-emphasis',
  'bg-warning-fg-emphasis',
  'bg-purple-fg-emphasis',
  'bg-pink-fg-emphasis',
  'bg-indigo-fg-emphasis',
  'bg-cyan-fg-emphasis',
  'bg-orange-fg-emphasis',
] as const;

function getBarColor(category: string, index: number): string {
  return CATEGORY_BAR_COLORS[category] ?? FALLBACK_BAR_COLORS[index % FALLBACK_BAR_COLORS.length];
}

function useCategorySummaryQuery(days: CategorySummaryDays) {
  return useQuery({
    queryKey: queryKeys.monitoring.categorySummary(days),
    queryFn: () => monitoringAPI.getCategorySummary(days),
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
}

interface TimeRangeSelectProps {
  value: CategorySummaryDays;
  onChange: (days: CategorySummaryDays) => void;
}

interface SummaryTotalProps {
  total: number;
}

function SummaryTotal({ total }: SummaryTotalProps) {
  return (
    <div className="flex items-baseline gap-1.5">
      <p className="text-2xl font-semibold text-text-primary tabular-nums">{total}</p>
      <span className="text-sm text-text-secondary">tests</span>
    </div>
  );
}

function TimeRangeSelect({ value, onChange }: TimeRangeSelectProps) {
  return (
    <div className="relative ml-auto shrink-0">
      <select
        value={value}
        onChange={event => onChange(Number(event.target.value) as CategorySummaryDays)}
        className={cn(
          'h-6 min-w-23 appearance-none rounded border border-border-default bg-surface',
          'pl-3 pr-7 text-[11px] leading-none text-text-secondary text-center',
          'cursor-pointer transition-colors duration-200',
          'hover:border-border-hover hover:bg-surface-hover hover:text-text-primary',
          'focus:outline-none focus-visible:border-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:ring-opacity-20'
        )}
        aria-label="Category summary time range"
      >
        {TIME_RANGE_OPTIONS.map(option => (
          <option key={option.days} value={option.days}>
            {option.label}
          </option>
        ))}
      </select>
      <Icon
        name={ICONS.actions.chevronDown}
        className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-text-tertiary"
        aria-hidden
      />
    </div>
  );
}

interface CategoryLegendProps {
  categories: CategorySummaryItem[];
}

function CategoryLegend({ categories }: CategoryLegendProps) {
  return (
    <ul className="space-y-2">
      {categories.map((item, index) => (
        <li key={item.category} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={cn('w-3 h-3 rounded shrink-0', getBarColor(item.category, index))}
              aria-hidden
            />
            <span className="text-xs text-text-primary truncate">{getCategoryLabel(item.category)}</span>
          </div>
          <span className="text-xs text-text-secondary tabular-nums shrink-0">{item.percentage}%</span>
        </li>
      ))}
    </ul>
  );
}

interface SegmentedBarProps {
  categories: CategorySummaryItem[];
}

function SegmentedBar({ categories }: SegmentedBarProps) {
  const segments = useMemo(
    () => categories.filter(item => item.percentage > 0),
    [categories]
  );

  if (segments.length === 0) {
    return <div className="h-5 rounded bg-neutral-100" aria-hidden />;
  }

  return (
    <div
      className="flex h-5 gap-0.5 overflow-hidden rounded"
      role="img"
      aria-label="Test category distribution"
    >
      {segments.map((item, index) => (
        <div
          key={item.category}
          className={cn(getBarColor(item.category, index))}
          style={{ width: `${item.percentage}%` }}
          title={`${getCategoryLabel(item.category)} ${item.percentage}%`}
        />
      ))}
    </div>
  );
}

export const CategorySummary: React.FC = () => {
  const [days, setDays] = useState<CategorySummaryDays>(90);
  const { data, isLoading, isError, refetch } = useCategorySummaryQuery(days);

  const categories = data?.categories ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="h-full bg-surface rounded border border-border-default shadow-sm overflow-hidden flex flex-col">
      <div className="shrink-0 px-4 py-2.5 border-b border-border-default flex items-center gap-3">
        <h3 className="text-sm font-light text-text-primary">Category</h3>
        <TimeRangeSelect value={days} onChange={setDays} />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
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
          <div className="flex min-h-full flex-col items-center justify-center gap-2 py-6 text-center">
            <p className="text-xs text-text-secondary">Unable to load category summary.</p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="text-xs text-brand hover:underline"
            >
              Retry
            </button>
          </div>
        ) : total === 0 ? (
          <div className="flex min-h-full items-center justify-center py-8">
            <p className="text-xs text-text-tertiary">No tests in this period.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <SummaryTotal total={total} />
              <SegmentedBar categories={categories} />
            </div>
            <CategoryLegend categories={categories} />
          </div>
        )}
      </div>
    </div>
  );
};
