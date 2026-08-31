/**
 * Modal filter panel for PaymentFilters on small screens.
 */

import React from 'react';
import { Modal, CheckboxList, OverlaySearchInput } from '@/components';
import {
  FilterModalFooter,
  DatePresetBadges,
  PAYMENT_FILTER_PLACEHOLDERS,
} from '@/features/filters';
import { PAYMENT_STATUS_VALUES, PAYMENT_STATUS_CONFIG } from '@/types';
import { createFilterOptions } from '@/utils/filtering';
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

export interface PaymentFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  dateRange: [Date, Date] | null;
  onDateRangeChange: (range: [Date, Date] | null) => void;
  statusFilters: PaymentStatus[];
  onStatusFiltersChange: (values: PaymentStatus[]) => void;
  methodFilters: PaymentMethod[];
  onMethodFiltersChange: (values: PaymentMethod[]) => void;
}

export const PaymentFiltersModal: React.FC<PaymentFiltersModalProps> = ({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  statusFilters,
  onStatusFiltersChange,
  methodFilters,
  onMethodFiltersChange,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Filter" size="md">
    <div className="flex flex-col h-full bg-surface">
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="mb-6">
          <OverlaySearchInput
            value={searchQuery}
            onChange={onSearchChange}
            placeholder={PAYMENT_FILTER_PLACEHOLDERS.search}
          />
        </div>

        <div className="space-y-5">
          <div className="w-full">
            <h4 className="text-sm font-semibold text-text-primary mb-3">Date Range</h4>
            <DatePresetBadges value={dateRange} onChange={onDateRangeChange} />
            <div className="border-b border-border-default mt-4" />
          </div>

          <div className="w-full">
            <h4 className="text-sm font-semibold text-text-primary mb-3">Payment Status</h4>
            <CheckboxList
              options={statusOptions}
              selectedIds={statusFilters}
              onChange={values => onStatusFiltersChange(values as PaymentStatus[])}
              columns={statusOptions.length > 4 ? 2 : 1}
            />
            <div className="border-b border-border-default mt-4" />
          </div>

          <div className="w-full">
            <h4 className="text-sm font-semibold text-text-primary mb-3">Payment Method</h4>
            <CheckboxList
              options={methodOptions}
              selectedIds={methodFilters}
              onChange={values => onMethodFiltersChange(values as PaymentMethod[])}
              columns={methodOptions.length > 4 ? 2 : 1}
            />
          </div>
        </div>
      </div>

      <FilterModalFooter
        onReset={() => {
          onDateRangeChange(null);
          onStatusFiltersChange([]);
          onMethodFiltersChange([]);
        }}
        onApply={onClose}
      />
    </div>
  </Modal>
);
