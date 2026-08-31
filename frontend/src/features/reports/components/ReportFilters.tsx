/**
 * ReportFilters Component
 * Responsive filter controls for validated test reports
 */

import React, { useState } from 'react';
import { Icon, Button, Badge, Modal, FooterInfo } from '@/components';
import { DebouncedSearchInput } from '@/components';
import { DateFilter } from '@/components';
import {
  inputContainerBase,
  inputInner,
  inputText,
  inputClearButton,
} from '@/components/inputs/inputStyles';
import { cn, ICONS } from '@/utils';
import { useBreakpoint, isBreakpointAtMost } from '@/hooks/useBreakpoint';
import { DatePresetBadges, REPORT_FILTER_PLACEHOLDERS } from '@/components/filters';

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
 * - lg+: 2-column grid (search + date)
 * - md: 2-column grid
 * - sm/xs: Search bar + Filters button (opens modal with date filter)
 */
export const ReportFilters: React.FC<ReportFiltersProps> = ({
  searchQuery,
  onSearchChange,
  dateRange,
  onDateRangeChange,
}) => {
  const breakpoint = useBreakpoint();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Count active filters for badge
  const activeFilterCount = dateRange ? 1 : 0;

  // Check if we should show modal view (sm and below)
  const showModalView = isBreakpointAtMost(breakpoint, 'sm');

  /**
   * Render all filter controls (used in both inline and modal views)
   */
  const renderFilters = () => (
    <>
      {/* Search */}
      <div className="flex h-9 w-full items-center">
        <DebouncedSearchInput
          value={searchQuery}
          onChange={onSearchChange}
          placeholder={REPORT_FILTER_PLACEHOLDERS.searchLong}
        />
      </div>

      {/* Date Range */}
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

  // Mobile view: Search bar + Filters button
  if (showModalView) {
    return (
      <>
        <div className="w-full bg-surface border-b border-border-default">
          <div className="px-3 py-2 w-full">
            <div className="grid grid-cols-[1fr_auto] gap-2 items-center w-full">
              {/* Search control */}
              <div className="flex h-9 w-full items-center">
                <DebouncedSearchInput
                  value={searchQuery}
                  onChange={onSearchChange}
                  placeholder={REPORT_FILTER_PLACEHOLDERS.search}
                />
              </div>

              {/* Filters button */}
              <div className="relative flex shrink-0">
                <Button variant="filter" size="sm" onClick={() => setIsModalOpen(true)}>
                  Filters
                </Button>
                {activeFilterCount > 0 && (
                  <Badge
                    variant="primary"
                    size="xs"
                    className="absolute -top-1 -right-1 min-w-[18px] h-4 px-1 flex items-center justify-center"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Filter Modal */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Filter" size="md">
          <div className="flex flex-col h-full bg-surface">
            {/* Filter Controls - Scrollable */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {/* Search Section */}
              <div className="mb-6">
                <div className={cn(inputContainerBase, 'flex items-center h-10 px-4')}>
                  <input
                    type="text"
                    placeholder={REPORT_FILTER_PLACEHOLDERS.search}
                    value={searchQuery}
                    onChange={e => onSearchChange(e.target.value)}
                    className={cn(inputInner, inputText)}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => onSearchChange('')}
                      className={cn(inputClearButton, 'hover:bg-surface-hover')}
                    >
                      <Icon
                        name={ICONS.actions.closeCircle}
                        className="w-4 h-4 text-text-tertiary"
                      />
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Sections */}
              <div className="space-y-5">
                {/* Date Range Section */}
                <div className="w-full">
                  <h4 className="text-sm font-semibold text-text-primary mb-3">Date Range</h4>
                  <DatePresetBadges value={dateRange} onChange={onDateRangeChange} />
                </div>
              </div>
            </div>

            {/* Footer with Filter Button */}
            <div className="px-5 py-4 border-t border-border-default bg-surface shrink-0">
              <div className="flex items-center justify-between gap-3">
                <FooterInfo icon={ICONS.actions.filter} text="Filtering results" />
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => onDateRangeChange(null)}
                    showIcon={false}
                  >
                    Reset
                  </Button>
                  <Button variant="primary" onClick={() => setIsModalOpen(false)} showIcon={false}>
                    Filter
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      </>
    );
  }

  // Desktop/Tablet view: 2-column grid
  return (
    <div className="w-full bg-surface border-b border-border-default">
      <div className="px-4 py-2.5 lg:px-5 lg:py-3 w-full">
        <div className="grid grid-cols-2 gap-3 lg:gap-4 items-center w-full">{renderFilters()}</div>
      </div>
    </div>
  );
};
