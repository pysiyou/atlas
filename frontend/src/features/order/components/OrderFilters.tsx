/**
 * OrderFilters Component
 * Responsive filter controls with modal for smaller screens
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Icon, Button, Badge, Modal, FooterInfo } from '@/shared/ui';
import { MultiSelectFilter } from '@/shared/ui';
import { CheckboxList } from '@/shared/ui';
import { DateFilter } from './DateFilter';
import { inputWrapper, inputInner, inputText, inputContainerBase } from '@/shared/ui/forms/inputStyles';
import { cn } from '@/utils';
import { ICONS } from '@/utils';
import { useBreakpoint, isBreakpointAtMost } from '@/hooks/useBreakpoint';
import {
  ORDER_STATUS_VALUES,
  PAYMENT_STATUS_VALUES,
  ORDER_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
} from '@/types';
import { createFilterOptions } from '@/utils/filtering';
import { DatePresetBadges } from '@/features/filters';
import type { OrderStatus, PaymentStatus } from '@/types';

/**
 * Props interface for OrderFilters component
 */
export interface OrderFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  dateRange: [Date, Date] | null;
  onDateRangeChange: (range: [Date, Date] | null) => void;
  statusFilters: OrderStatus[];
  onStatusFiltersChange: (values: OrderStatus[]) => void;
  paymentFilters: PaymentStatus[];
  onPaymentFiltersChange: (values: PaymentStatus[]) => void;
}

// Prepare filter options
const orderStatusOptions = createFilterOptions(ORDER_STATUS_VALUES, ORDER_STATUS_CONFIG);
const paymentStatusOptions = createFilterOptions(PAYMENT_STATUS_VALUES, PAYMENT_STATUS_CONFIG);

/**
 * SearchInput - Simple debounced search input
 */
const SearchInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder = 'Search...' }) => {
  const [localValue, setLocalValue] = useState(value);
  const [isDebouncing, setIsDebouncing] = useState(false);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (localValue === value) {
      setIsDebouncing(false);
      return;
    }

    setIsDebouncing(true);
    const timer = setTimeout(() => {
      onChange(localValue);
      setIsDebouncing(false);
    }, 300);

    return () => {
      clearTimeout(timer);
      setIsDebouncing(false);
    };
  }, [localValue, value, onChange]);

  const handleClear = useCallback(() => {
    setLocalValue('');
    onChange('');
  }, [onChange]);

  return (
    <div className={cn(inputWrapper)}>
      <Icon
        name={ICONS.actions.search}
        className="w-3.5 h-3.5 shrink-0 text-fg-faint group-hover:text-brand transition-colors"
      />
      <input
        type="text"
        placeholder={placeholder}
        value={localValue}
        onChange={e => setLocalValue(e.target.value)}
        className={cn(inputInner, inputText, 'font-normal')}
      />
      <div className="flex items-center gap-1 shrink-0">
        {isDebouncing && (
          <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        )}
        {localValue && !isDebouncing && (
          <button
            onClick={handleClear}
            className="p-0.5 hover:bg-canvas rounded transition-colors flex items-center justify-center cursor-pointer"
            aria-label="Clear search"
          >
            <Icon
              name={ICONS.actions.closeCircle}
              className="w-4 h-4 text-fg-faint hover:text-fg-subtle"
            />
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * OrderFilters - Responsive filter layout
 * - lg+: 4-column grid (search + date + order status + payment status)
 * - md: 2-column grid
 * - sm/xs: Search bar + Filters button (opens modal with all filters)
 */
export const OrderFilters: React.FC<OrderFiltersProps> = ({
  searchQuery,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  statusFilters,
  onStatusFiltersChange,
  paymentFilters,
  onPaymentFiltersChange,
}) => {
  const breakpoint = useBreakpoint();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Count active filters for badge
  const activeFilterCount =
    (dateRange ? 1 : 0) +
    statusFilters.length +
    paymentFilters.length;

  // Check if we should show modal view (sm and below)
  const showModalView = isBreakpointAtMost(breakpoint, 'sm');
  const showTwoColumn = breakpoint === 'md';

  /**
   * Render all filter controls (used in both inline and modal views)
   */
  const renderFilters = () => (
    <>
      {/* Search */}
      <div className="flex h-9 w-full items-center">
        <SearchInput
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search orders by ID, patient name, or details..."
        />
      </div>

      {/* Date Range */}
      <div className="flex h-9 w-full items-center">
        <DateFilter
          value={dateRange}
          onChange={onDateRangeChange}
          placeholder="Filter by date range"
          className="w-full"
        />
      </div>

      {/* Order Status */}
      <div className="flex h-9 w-full items-center">
        <MultiSelectFilter
          label="Order Status"
          options={orderStatusOptions}
          selectedIds={statusFilters}
          onChange={values => onStatusFiltersChange(values as OrderStatus[])}
          placeholder="Select order status"
          selectAllLabel="All statuses"
          icon={ICONS.actions.infoCircle}
          className="w-full"
        />
      </div>

      {/* Payment Status */}
      <div className="flex h-9 w-full items-center">
        <MultiSelectFilter
          label="Payment Status"
          options={paymentStatusOptions}
          selectedIds={paymentFilters}
          onChange={values => onPaymentFiltersChange(values as PaymentStatus[])}
          placeholder="Select payment status"
          selectAllLabel="All payment statuses"
          icon={ICONS.dataFields.wallet}
          className="w-full"
        />
      </div>
    </>
  );

  // Mobile view: Search bar + Filters button
  if (showModalView) {
    return (
      <>
        <div className="w-full bg-panel border-b border-stroke">
          <div className="px-3 py-2 w-full">
            <div className="grid grid-cols-[1fr_auto] gap-2 items-center w-full">
              {/* Search control */}
              <div className="flex h-9 w-full items-center">
                <SearchInput
                  value={searchQuery}
                  onChange={onSearchChange}
                  placeholder="Search orders..."
                />
              </div>

              {/* Filters button */}
              <div className="relative flex shrink-0">
                <Button
                  variant="filter"
                  size="sm"
                  onClick={() => setIsModalOpen(true)}
                >
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
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Filter"
          size="md"
        >
          <div className="flex flex-col h-full bg-panel">
            {/* Filter Controls - Scrollable */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {/* Search Section */}
              <div className="mb-6">
                <div className={cn(inputContainerBase, 'flex items-center h-10 px-4')}>
                  <input
                    type="text"
                    placeholder="Search orders..."
                    value={searchQuery}
                    onChange={e => onSearchChange(e.target.value)}
                    className={cn(inputInner, inputText)}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => onSearchChange('')}
                      className="p-0.5 hover:bg-panel-hover rounded transition-colors"
                    >
                      <Icon name={ICONS.actions.closeCircle} className="w-4 h-4 text-fg-subtle" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Sections */}
              <div className="space-y-5">
                {/* Date Range Section */}
                <div className="w-full">
                  <h4 className="text-sm font-semibold text-fg mb-3">Date Range</h4>
                  <DatePresetBadges
                    value={dateRange}
                    onChange={onDateRangeChange}
                  />
                  <div className="border-b border-stroke mt-4" />
                </div>

                {/* Order Status Section */}
                <div className="w-full">
                  <h4 className="text-sm font-semibold text-fg mb-3">Order Status</h4>
                  <CheckboxList
                    options={orderStatusOptions}
                    selectedIds={statusFilters}
                    onChange={values => onStatusFiltersChange(values as OrderStatus[])}
                    columns={orderStatusOptions.length > 4 ? 2 : 1}
                  />
                  <div className="border-b border-stroke mt-4" />
                </div>

                {/* Payment Status Section */}
                <div className="w-full">
                  <h4 className="text-sm font-semibold text-fg mb-3">Payment Status</h4>
                  <CheckboxList
                    options={paymentStatusOptions}
                    selectedIds={paymentFilters}
                    onChange={values => onPaymentFiltersChange(values as PaymentStatus[])}
                    columns={paymentStatusOptions.length > 4 ? 2 : 1}
                  />
                </div>
              </div>
            </div>

            {/* Footer with Filter Button */}
            <div className="px-5 py-4 border-t border-stroke bg-panel shrink-0">
              <div className="flex items-center justify-between gap-3">
                <FooterInfo icon={ICONS.actions.filter} text="Filtering results" />
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      onDateRangeChange(null);
                      onStatusFiltersChange([]);
                      onPaymentFiltersChange([]);
                    }}
                    showIcon={false}
                  >
                    Reset
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => setIsModalOpen(false)}
                    showIcon={false}
                  >
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

  // Tablet view: 2-column grid
  if (showTwoColumn) {
    return (
      <div className="w-full bg-panel border-b border-stroke">
        <div className="px-3 py-2 w-full">
          <div className="grid grid-cols-2 gap-2 items-center w-full">
            {renderFilters()}
          </div>
        </div>
      </div>
    );
  }

  // Desktop view: 4-column grid
  return (
    <div className="w-full bg-panel border-b border-stroke">
      <div className="px-4 py-2.5 lg:px-5 lg:py-3 w-full">
        <div className="grid grid-cols-4 gap-3 lg:gap-4 items-center w-full">
          {renderFilters()}
        </div>
      </div>
    </div>
  );
};
