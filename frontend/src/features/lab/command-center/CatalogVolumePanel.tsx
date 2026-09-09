/**
 * Catalog volume — test count breakdown by catalog category.
 */

import React, { useMemo } from 'react';
import { Skeleton } from '@/components/loaders/Skeleton';
import { getCategoryLabel } from '@/features/catalog/constants/catalogConfig';
import { getCategoryBarColorClass } from '@/components/theme';
import { cn } from '@/utils';
import type { CategorySummaryItem } from '../api/commandCenter.api';
import {
  COMMAND_CENTER_SECTION,
  Panel,
  PanelBody,
  PanelEmpty,
  PanelError,
} from './components';
import { timeRangeToDays } from './timeRange';
import {
  useCommandCenterDashboardContext,
  usePanelTimeRangeHeader,
} from './useCommandCenterDashboard';

const MAX_VISIBLE_CATEGORIES = 5;

interface DisplayCategory extends CategorySummaryItem {
  colorClass: string;
  isOther?: boolean;
}

function buildDisplayCategories(categories: CategorySummaryItem[]): DisplayCategory[] {
  const withColors = categories.map((item, index) => ({
    ...item,
    colorClass: getCategoryBarColorClass(item.category, index),
  }));

  if (withColors.length <= MAX_VISIBLE_CATEGORIES) return withColors;

  const visible = withColors.slice(0, MAX_VISIBLE_CATEGORIES - 1);
  const rest = withColors.slice(MAX_VISIBLE_CATEGORIES - 1);
  const otherCount = rest.reduce((sum, item) => sum + item.count, 0);
  const otherPct = rest.reduce((sum, item) => sum + item.percentage, 0);

  return [
    ...visible,
    {
      category: 'other',
      count: otherCount,
      percentage: otherPct,
      colorClass: 'bg-border-strong',
      isOther: true,
    },
  ];
}

function VolumeBreakdown({
  categories,
  total,
  days,
  categoryCount,
}: {
  categories: DisplayCategory[];
  total: number;
  days: number;
  categoryCount: number;
}) {
  const top = categories[0];
  const dailyAvg = total > 0 ? Math.round(total / days) : 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-hidden px-3 py-1.5">
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className={COMMAND_CENTER_SECTION.statLabel}>Total tests</p>
          <p className="text-xl font-semibold leading-none tabular-nums text-text-primary">
            {total.toLocaleString()}
          </p>
          <p className="mt-0.5 text-xxs tabular-nums text-text-tertiary">
            ~{dailyAvg.toLocaleString()}/day
          </p>
        </div>
        {top && (
          <div className="text-right">
            <p className={COMMAND_CENTER_SECTION.statLabel}>Leading category</p>
            <p className="text-sm font-semibold leading-none text-text-secondary">
              {top.isOther ? 'Other' : getCategoryLabel(top.category)}
            </p>
            <p className="mt-0.5 text-xxs tabular-nums text-brand">
              {top.percentage}% · {top.count.toLocaleString()}
            </p>
          </div>
        )}
      </div>

      <div className="flex h-1 overflow-hidden rounded-full bg-surface-hover">
        {categories.map(item => (
          <div
            key={item.category}
            className={cn('h-full', item.colorClass)}
            style={{ width: `${item.percentage}%` }}
            title={`${item.isOther ? 'Other' : getCategoryLabel(item.category)} ${item.percentage}%`}
          />
        ))}
      </div>
      <p className="text-[9px] tabular-nums text-text-tertiary">
        {categoryCount} categories · last {days} days
      </p>

      <div className="min-h-0 flex-1 pt-1.5">
        <p className="mb-1 text-[9px] font-medium uppercase tracking-wide text-text-tertiary">
          Category mix
        </p>
        <ul className="space-y-1">
          {categories.map(item => (
            <li key={item.category}>
              <div className="flex items-center justify-between gap-2 text-xxs">
                <span className="flex min-w-0 items-center gap-1 truncate text-text-secondary">
                  <span className={cn('h-1.5 w-1.5 shrink-0 rounded-sm', item.colorClass)} />
                  {item.isOther ? 'Other' : getCategoryLabel(item.category)}
                </span>
                <span className="shrink-0 tabular-nums text-text-primary">
                  {item.count.toLocaleString()}
                  <span className="text-text-tertiary"> ({item.percentage}%)</span>
                </span>
              </div>
              <div className="mt-0.5 h-0.5 overflow-hidden rounded-full bg-surface-hover">
                <div
                  className={cn('h-full rounded-full', item.colorClass)}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export const CatalogVolumePanel: React.FC = () => {
  const { data, isLoading, isError, refetch, timeRange } = useCommandCenterDashboardContext();
  const { meta, headerActions } = usePanelTimeRangeHeader();
  const days = timeRangeToDays(timeRange);

  const total = data?.categorySummary.total ?? 0;
  const categories = useMemo(
    () => data?.categorySummary.categories ?? [],
    [data?.categorySummary.categories]
  );
  const displayCategories = useMemo(() => buildDisplayCategories(categories), [categories]);

  return (
    <Panel title="Catalog Volume" meta={meta} headerActions={headerActions}>
      <PanelBody>
        {isLoading ? (
          <div className="space-y-2 px-3 py-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-1 w-full" />
            <div className="space-y-1.5 pt-1">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-3 w-full" />
              ))}
            </div>
          </div>
        ) : isError ? (
          <PanelError message="Unable to load catalog volume." onRetry={() => void refetch()} />
        ) : total === 0 ? (
          <PanelEmpty message="No tests in this period." />
        ) : (
          <VolumeBreakdown
            categories={displayCategories}
            total={total}
            days={days}
            categoryCount={categories.length}
          />
        )}
      </PanelBody>
    </Panel>
  );
};
