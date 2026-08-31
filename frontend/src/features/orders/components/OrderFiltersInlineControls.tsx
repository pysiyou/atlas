/**
 * Inline filter controls for OrderFilters (tablet and desktop layouts).
 */

import React from 'react';
import { DebouncedSearchInput, MultiSelectFilter, DateFilter } from '@/components';
import { ICONS } from '@/utils';
import {
  ORDER_STATUS_VALUES,
  PAYMENT_STATUS_VALUES,
  ORDER_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
} from '@/types';
import { createFilterOptions } from '@/utils/filtering';
import { ORDER_FILTER_PLACEHOLDERS } from '@/filters';
import type { OrderStatus, PaymentStatus } from '@/types';

const orderStatusOptions = createFilterOptions(ORDER_STATUS_VALUES, ORDER_STATUS_CONFIG);
const paymentStatusOptions = createFilterOptions(PAYMENT_STATUS_VALUES, PAYMENT_STATUS_CONFIG);

export interface OrderFiltersInlineControlsProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  dateRange: [Date, Date] | null;
  onDateRangeChange: (range: [Date, Date] | null) => void;
  statusFilters: OrderStatus[];
  onStatusFiltersChange: (values: OrderStatus[]) => void;
  paymentFilters: PaymentStatus[];
  onPaymentFiltersChange: (values: PaymentStatus[]) => void;
}

export const OrderFiltersInlineControls: React.FC<OrderFiltersInlineControlsProps> = ({
  searchQuery,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  statusFilters,
  onStatusFiltersChange,
  paymentFilters,
  onPaymentFiltersChange,
}) => (
  <>
    <div className="flex h-9 w-full items-center">
      <DebouncedSearchInput
        value={searchQuery}
        onChange={onSearchChange}
        placeholder={ORDER_FILTER_PLACEHOLDERS.searchLong}
      />
    </div>

    <div className="flex h-9 w-full items-center">
      <DateFilter
        value={dateRange}
        onChange={onDateRangeChange}
        placeholder={ORDER_FILTER_PLACEHOLDERS.dateRange}
        className="w-full"
      />
    </div>

    <div className="flex h-9 w-full items-center">
      <MultiSelectFilter
        label="Order Status"
        options={orderStatusOptions}
        selectedIds={statusFilters}
        onChange={values => onStatusFiltersChange(values as OrderStatus[])}
        placeholder={ORDER_FILTER_PLACEHOLDERS.orderStatus}
        selectAllLabel="All statuses"
        icon={ICONS.actions.infoCircle}
        className="w-full"
      />
    </div>

    <div className="flex h-9 w-full items-center">
      <MultiSelectFilter
        label="Payment Status"
        options={paymentStatusOptions}
        selectedIds={paymentFilters}
        onChange={values => onPaymentFiltersChange(values as PaymentStatus[])}
        placeholder={ORDER_FILTER_PLACEHOLDERS.paymentStatus}
        selectAllLabel="All payment statuses"
        icon={ICONS.dataFields.wallet}
        className="w-full"
      />
    </div>
  </>
);
