/**
 * Inline filter controls for PaymentFilters (tablet and desktop layouts).
 */

import React from 'react';
import { DebouncedSearchInput, MultiSelectFilter, DateFilter } from '@/components';
import { ICONS } from '@/utils';
import { PAYMENT_STATUS_VALUES, PAYMENT_STATUS_CONFIG } from '@/types';
import { createFilterOptions } from '@/utils/filtering';
import { PAYMENT_FILTER_PLACEHOLDERS } from '@/features/filters';
import { getEnabledPaymentMethods } from '@/types/billing';
import type { PaymentStatus, PaymentMethod } from '@/types';

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

export interface PaymentFiltersInlineControlsProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  dateRange: [Date, Date] | null;
  onDateRangeChange: (range: [Date, Date] | null) => void;
  statusFilters: PaymentStatus[];
  onStatusFiltersChange: (values: PaymentStatus[]) => void;
  methodFilters: PaymentMethod[];
  onMethodFiltersChange: (values: PaymentMethod[]) => void;
}

export const PaymentFiltersInlineControls: React.FC<PaymentFiltersInlineControlsProps> = ({
  searchQuery,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  statusFilters,
  onStatusFiltersChange,
  methodFilters,
  onMethodFiltersChange,
}) => (
  <>
    <div className="flex h-[34px] w-full items-center">
      <DebouncedSearchInput
        value={searchQuery}
        onChange={onSearchChange}
        placeholder={PAYMENT_FILTER_PLACEHOLDERS.searchLong}
      />
    </div>

    <div className="flex h-[34px] w-full items-center">
      <DateFilter
        value={dateRange}
        onChange={onDateRangeChange}
        placeholder={PAYMENT_FILTER_PLACEHOLDERS.dateRange}
        className="w-full"
      />
    </div>

    <div className="flex h-[34px] w-full items-center">
      <MultiSelectFilter
        label="Payment Status"
        options={statusOptions}
        selectedIds={statusFilters}
        onChange={values => onStatusFiltersChange(values as PaymentStatus[])}
        placeholder={PAYMENT_FILTER_PLACEHOLDERS.paymentStatus}
        selectAllLabel="All statuses"
        icon={ICONS.actions.infoCircle}
        className="w-full"
      />
    </div>

    <div className="flex h-[34px] w-full items-center">
      <MultiSelectFilter
        label="Payment Method"
        options={methodOptions}
        selectedIds={methodFilters}
        onChange={values => onMethodFiltersChange(values as PaymentMethod[])}
        placeholder={PAYMENT_FILTER_PLACEHOLDERS.paymentMethod}
        selectAllLabel="All methods"
        icon={ICONS.dataFields.wallet}
        className="w-full"
      />
    </div>
  </>
);
