/**
 * LabQueueFilters - Shared filter row for lab workflow tabs
 */

import React, { useMemo } from 'react';
import type { FilterConfig } from '@/components/filters';
import { FeatureFilterBar } from '@/components/filters';

export interface LabQueueFiltersProps<S = string[]> {
  config: FilterConfig;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  dateRange: [Date, Date] | null;
  onDateRangeChange: (range: [Date, Date] | null) => void;
  sampleTypeFilters: string[];
  onSampleTypeFiltersChange: (values: string[]) => void;
  statusFilters: S;
  onStatusFiltersChange: (values: S) => void;
  statusFilterKey?: 'status' | 'priority';
  priorityGroupFilters?: string[];
  onPriorityGroupFiltersChange?: (values: string[]) => void;
}

export function LabQueueFilters<S = string[]>({
  config,
  searchQuery,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  sampleTypeFilters,
  onSampleTypeFiltersChange,
  statusFilters,
  onStatusFiltersChange,
  statusFilterKey = 'status',
  priorityGroupFilters = [],
  onPriorityGroupFiltersChange,
}: LabQueueFiltersProps<S>): React.ReactElement {
  const value = useMemo(
    () => ({
      searchQuery,
      dateRange,
      sampleType: sampleTypeFilters,
      priorityGroup: priorityGroupFilters,
      ...(statusFilterKey === 'priority'
        ? { priority: statusFilters }
        : { status: statusFilters }),
    }),
    [
      searchQuery,
      dateRange,
      sampleTypeFilters,
      statusFilters,
      statusFilterKey,
      priorityGroupFilters,
    ],
  );

  const handlers = useMemo(
    () =>
      statusFilterKey === 'priority'
        ? {
            searchQuery: onSearchChange,
            dateRange: onDateRangeChange,
            sampleType: onSampleTypeFiltersChange,
            priority: onStatusFiltersChange,
            priorityGroup: onPriorityGroupFiltersChange,
          }
        : {
            searchQuery: onSearchChange,
            dateRange: onDateRangeChange,
            sampleType: onSampleTypeFiltersChange,
            status: onStatusFiltersChange,
            priorityGroup: onPriorityGroupFiltersChange,
          },
    [
      statusFilterKey,
      onSearchChange,
      onDateRangeChange,
      onSampleTypeFiltersChange,
      onStatusFiltersChange,
      onPriorityGroupFiltersChange,
    ],
  );

  return <FeatureFilterBar config={config} value={value} handlers={handlers} />;
}
