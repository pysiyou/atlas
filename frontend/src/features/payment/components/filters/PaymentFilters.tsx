/**
 * PaymentFilters Component
 * Simplified filter controls for payments list with direct component usage
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from '@/shared/ui/Icon';
import { MultiSelectFilter } from '@/shared/ui/MultiSelectFilter';
import { DateFilter } from '@/features/order/components/filters/DateFilter';
import { cn } from '@/utils';
import { ICONS } from '@/utils/icon-mappings';
import { brandColors, neutralColors } from '@/shared/design-system/tokens/colors';
import { filterControlSizing } from '@/shared/design-system/tokens/sizing';
import { radius } from '@/shared/design-system/tokens/borders';
import { hover, focus } from '@/shared/design-system/tokens/interactions';
import { transitions } from '@/shared/design-system/tokens/animations';
import { PAYMENT_STATUS_VALUES, PAYMENT_STATUS_CONFIG } from '@/types';
import { createFilterOptions } from '@/utils/filtering';
import { getEnabledPaymentMethods } from '@/types/billing';
import type { PaymentStatus, PaymentMethod } from '@/types';

/**
 * Props interface for PaymentFilters component
 */
export interface PaymentFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  dateRange: [Date, Date] | null;
  onDateRangeChange: (range: [Date, Date] | null) => void;
  statusFilters: PaymentStatus[];
  onStatusFiltersChange: (values: PaymentStatus[]) => void;
  methodFilters: PaymentMethod[];
  onMethodFiltersChange: (values: PaymentMethod[]) => void;
}

// Prepare filter options
const statusOptions = createFilterOptions(PAYMENT_STATUS_VALUES, PAYMENT_STATUS_CONFIG);

const PAYMENT_METHOD_CONFIG: Record<PaymentMethod, { label: string }> = {
  cash: { label: 'Cash' },
  'credit-card': { label: 'Credit Card' },
  'debit-card': { label: 'Debit Card' },
  insurance: { label: 'Insurance' },
  'bank-transfer': { label: 'Bank Transfer' },
  'mobile-money': { label: 'Mobile Money' },
};

const methodOptions = createFilterOptions(
  getEnabledPaymentMethods().map(m => m.value) as PaymentMethod[],
  PAYMENT_METHOD_CONFIG
);

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

  // Sync local value when prop changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounce effect
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
    <div
      className={cn(
        'relative w-full flex items-center gap-2',
        filterControlSizing.height,
        'px-3 bg-surface border',
        neutralColors.border.medium,
        radius.md,
        hover.background,
        focus.outline,
        `focus-within:${brandColors.primary.borderMedium}`,
        transitions.colors
      )}
    >
      <Icon
        name={ICONS.actions.search}
        className={cn(neutralColors.text.disabled, 'w-3.5 h-3.5 shrink-0')}
      />
      <input
        type="text"
        placeholder={placeholder}
        value={localValue}
        onChange={e => setLocalValue(e.target.value)}
        className={cn(
          'flex-1 min-w-0 text-xs font-medium bg-transparent border-0 outline-none py-0',
          'placeholder:font-normal',
          `placeholder:${neutralColors.text.muted}`
        )}
      />
      <div className="flex items-center gap-1 shrink-0">
        {isDebouncing && (
          <div
            className={cn(
              'w-4 h-4 border-2 border-t-transparent rounded-full animate-spin',
              brandColors.primary.borderMedium
            )}
          />
        )}
        {localValue && !isDebouncing && (
          <button
            onClick={handleClear}
            className={cn(
              'p-0.5',
              hover.background,
              'rounded',
              transitions.colors,
              'flex items-center justify-center cursor-pointer'
            )}
            aria-label="Clear search"
          >
            <Icon
              name={ICONS.actions.closeCircle}
              className={cn('w-4 h-4', neutralColors.text.disabled, `hover:${neutralColors.text.tertiary}`)}
            />
          </button>
        )}
      </div>
    </div>
  );
};

/**
 * PaymentFilters - Simple 4-column grid layout with search + 3 filters
 */
export const PaymentFilters: React.FC<PaymentFiltersProps> = ({
  searchQuery,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  statusFilters,
  onStatusFiltersChange,
  methodFilters,
  onMethodFiltersChange,
}) => {
  return (
    <div className={cn('w-full bg-surface border-b', neutralColors.border.default)}>
      <div className="px-4 py-2.5 lg:px-5 lg:py-3 w-full">
        {/* 4-column grid: search + date + status + method */}
        <div className="grid grid-cols-4 gap-3 lg:gap-4 items-center w-full">
          {/* Search */}
          <div className={cn('flex', filterControlSizing.height, 'w-full items-center')}>
            <SearchInput
              value={searchQuery}
              onChange={onSearchChange}
              placeholder="Search payments by transaction ID, patient name, or reference..."
            />
          </div>

          {/* Date Range */}
          <div className={cn('flex', filterControlSizing.height, 'w-full items-center')}>
            <DateFilter
              value={dateRange}
              onChange={onDateRangeChange}
              placeholder="Filter by date range"
              className="w-full"
            />
          </div>

          {/* Status */}
          <div className={cn('flex', filterControlSizing.height, 'w-full items-center')}>
            <MultiSelectFilter
              label="Payment Status"
              options={statusOptions}
              selectedIds={statusFilters}
              onChange={values => onStatusFiltersChange(values as PaymentStatus[])}
              placeholder="Select payment status"
              selectAllLabel="All statuses"
              icon={ICONS.actions.infoCircle}
              className="w-full"
            />
          </div>

          {/* Method */}
          <div className={cn('flex', filterControlSizing.height, 'w-full items-center')}>
            <MultiSelectFilter
              label="Payment Method"
              options={methodOptions}
              selectedIds={methodFilters}
              onChange={values => onMethodFiltersChange(values as PaymentMethod[])}
              placeholder="Select payment method"
              selectAllLabel="All methods"
              icon={ICONS.dataFields.wallet}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
