/**
 * ReportFilters Component
 * Responsive filter controls for reportable order reports
 */

import React, { useState } from 'react';
import { FILTER_TYPE } from '@/theme/recipes';
import { DateFilter } from '@/components/inputs';
import { SearchTextInput } from '@/components/inputs';
import { MODULE_ICONS } from '@/config/icons';
import { useBreakpoint, isBreakpointAtMost } from '@/hooks/useBreakpoint';
import {
  DatePresetChipSelect,
  ListFilterModal,
  REPORT_FILTER_PLACEHOLDERS,
  ResponsiveFilterMobileBar,
} from '@/components/filters';

/**
 * Props interface for ReportFilters component
 */
export interface ReportFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  dateRange: [Date, Date] | null;
  onDateRangeChange: (range: [Date, Date] | null) => void;
}

/**
 * ReportFilters - Responsive filter layout
 * - lg+/md: 2-column grid (search + date)
 * - sm/xs: Search bar + Filters button (opens ListFilterModal)
 */
export const ReportFilters: React.FC<ReportFiltersProps> = ({
  searchQuery,
  onSearchChange,
  dateRange,
  onDateRangeChange,
}) => {
  const breakpoint = useBreakpoint();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const activeFilterCount = dateRange ? 1 : 0;
  const showModalView = isBreakpointAtMost(breakpoint, 'sm');

  const renderFilters = () => (
    <>
      <div className="flex h-9 w-full items-center">
        <SearchTextInput
          value={searchQuery}
          onChange={onSearchChange}
          placeholder={REPORT_FILTER_PLACEHOLDERS.searchLong}
        />
      </div>
      <div className="flex h-9 w-full items-center">
        <DateFilter
          value={dateRange}
          onChange={onDateRangeChange}
          placeholder={REPORT_FILTER_PLACEHOLDERS.dateRange}
          className="w-full"
        />
      </div>
    </>
  );

  if (showModalView) {
    return (
      <>
        <ResponsiveFilterMobileBar
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          searchPlaceholder={REPORT_FILTER_PLACEHOLDERS.search}
          activeFilterCount={activeFilterCount}
          onOpenModal={() => setIsModalOpen(true)}
          searchRowHeight="h-9"
        />
        <ListFilterModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          searchPlaceholder={REPORT_FILTER_PLACEHOLDERS.search}
          onReset={() => onDateRangeChange(null)}
          footerIcon={MODULE_ICONS.reports}
          footerLabel="Reports"
        >
          <div className="w-full">
            <h4 className={FILTER_TYPE.sectionTitle}>Date Range</h4>
            <DatePresetChipSelect value={dateRange} onChange={onDateRangeChange} />
          </div>
        </ListFilterModal>
      </>
    );
  }

  return (
    <div className="w-full bg-surface border-b border-border-default">
      <div className="px-space-4 py-space-2-5 lg:px-space-5 lg:py-space-3 w-full">
        <div className="grid grid-cols-2 gap-space-3 lg:gap-layout-section items-center w-full">{renderFilters()}</div>
      </div>
    </div>
  );
};
