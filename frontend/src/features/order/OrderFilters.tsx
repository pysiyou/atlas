import React from 'react';
import { DateFilter } from './DateFilter';
import { SearchBar, MultiSelectFilter } from '@/shared/ui';
import type { OrderStatus, PaymentStatus } from '@/types';
import { ORDER_STATUS_VALUES, PAYMENT_STATUS_VALUES, ORDER_STATUS_CONFIG, PAYMENT_STATUS_CONFIG } from '@/types';
import { createFilterOptions } from '@/utils/filterUtils';

const orderStatusOptions = createFilterOptions(ORDER_STATUS_VALUES, ORDER_STATUS_CONFIG);
const paymentStatusOptions = createFilterOptions(PAYMENT_STATUS_VALUES, PAYMENT_STATUS_CONFIG);

interface OrderFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  dateRange: [Date, Date] | null;
  onDateRangeChange: (range: [Date, Date] | null) => void;
  statusFilters: OrderStatus[];
  onStatusFiltersChange: (values: OrderStatus[]) => void;
  paymentFilters: PaymentStatus[];
  onPaymentFiltersChange: (values: PaymentStatus[]) => void;
}

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
  return (
    <div className="p-4 border-b border-gray-200 shrink-0 bg-gray-50/50">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-[240px]">
            <DateFilter
              value={dateRange}
              onChange={onDateRangeChange}
              placeholder="Filter by Date"
              className="w-full"
            />
          </div>

          <div className="h-6 w-px bg-gray-300 hidden md:block" />

          <MultiSelectFilter
            label="Status"
            options={orderStatusOptions}
            selectedIds={statusFilters}
            onChange={(ids) => onStatusFiltersChange(ids as OrderStatus[])}
            selectAllLabel="Select all"
            icon="checklist"
            placeholder="Filter by Status"
          />

          <div className="h-6 w-px bg-gray-300 hidden md:block" />

          <MultiSelectFilter
            label="Payment"
            options={paymentStatusOptions}
            selectedIds={paymentFilters}
            onChange={(ids) => onPaymentFiltersChange(ids as PaymentStatus[])}
            selectAllLabel="Select all"
            icon="wallet"
            placeholder="Filter by Payment"
          />
        </div>

        <div className="w-full md:w-72">
          <SearchBar
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            size="sm"
          />
        </div>
      </div>
    </div>
  );
};
