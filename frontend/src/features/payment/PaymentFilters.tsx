import React from 'react';
import { SearchBar, MultiSelectFilter } from '@/shared/ui';
import type { PaymentStatus, PaymentMethod } from '@/types';
import { PAYMENT_STATUS_VALUES, PAYMENT_STATUS_CONFIG } from '@/types';
import { createFilterOptions } from '@/utils/filtering';

const paymentStatusOptions = createFilterOptions(PAYMENT_STATUS_VALUES, PAYMENT_STATUS_CONFIG);

// Full list of payment methods (kept for reference)
// const ALL_PAYMENT_METHOD_VALUES: PaymentMethod[] = ['cash', 'credit-card', 'debit-card', 'insurance', 'bank-transfer', 'mobile-money'];

// Currently enabled payment methods - only Cash and Mobile Money are active
// TODO: Enable other payment methods when backend support is ready
const PAYMENT_METHOD_VALUES: PaymentMethod[] = ['cash', 'mobile-money'];

const PAYMENT_METHOD_CONFIG: Record<PaymentMethod, { label: string; color: string }> = {
  'cash': { label: 'Cash', color: 'cash' },
  'credit-card': { label: 'Credit Card', color: 'credit-card' },
  'debit-card': { label: 'Debit Card', color: 'debit-card' },
  'insurance': { label: 'Insurance', color: 'insurance' },
  'bank-transfer': { label: 'Bank Transfer', color: 'bank-transfer' },
  'mobile-money': { label: 'Mobile Money', color: 'mobile-money' },
};

const paymentMethodOptions = createFilterOptions(PAYMENT_METHOD_VALUES, PAYMENT_METHOD_CONFIG);

interface PaymentFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilters: PaymentStatus[];
  onStatusFiltersChange: (values: PaymentStatus[]) => void;
  methodFilters: PaymentMethod[];
  onMethodFiltersChange: (values: PaymentMethod[]) => void;
}

export const PaymentFilters: React.FC<PaymentFiltersProps> = ({
  searchQuery,
  onSearchChange,
  statusFilters,
  onStatusFiltersChange,
  methodFilters,
  onMethodFiltersChange,
}) => {
  return (
    <div className="p-4 border-b border-gray-200 shrink-0 bg-gray-50/50">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <MultiSelectFilter
            label="Status"
            options={paymentStatusOptions}
            selectedIds={statusFilters}
            onChange={(ids) => onStatusFiltersChange(ids as PaymentStatus[])}
            selectAllLabel="Select all"
            icon="clock"
            placeholder="Filter by Status"
          />

          <div className="h-6 w-px bg-gray-300 hidden md:block" />

          <MultiSelectFilter
            label="Method"
            options={paymentMethodOptions}
            selectedIds={methodFilters}
            onChange={(ids) => onMethodFiltersChange(ids as PaymentMethod[])}
            selectAllLabel="Select all"
            icon="wallet"
            placeholder="Filter by Method"
          />
        </div>

        <div className="w-full md:w-72">
          <SearchBar
            placeholder="Search payments..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            size="sm"
          />
        </div>
      </div>
    </div>
  );
};
