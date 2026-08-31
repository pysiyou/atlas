/**
 * Modal filter panel for OrderFilters on small screens.
 */

import React from 'react';
import { Modal, CheckboxList, OverlaySearchInput } from '@/components';
import {
  FilterModalFooter,
  DatePresetBadges,
  ORDER_FILTER_PLACEHOLDERS,
} from '@/filters';
import {
  ORDER_STATUS_VALUES,
  PAYMENT_STATUS_VALUES,
  ORDER_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
} from '@/types';
import { createFilterOptions } from '@/utils/filtering';
import type { OrderStatus, PaymentStatus } from '@/types';

const orderStatusOptions = createFilterOptions(ORDER_STATUS_VALUES, ORDER_STATUS_CONFIG);
const paymentStatusOptions = createFilterOptions(PAYMENT_STATUS_VALUES, PAYMENT_STATUS_CONFIG);

export interface OrderFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  dateRange: [Date, Date] | null;
  onDateRangeChange: (range: [Date, Date] | null) => void;
  statusFilters: OrderStatus[];
  onStatusFiltersChange: (values: OrderStatus[]) => void;
  paymentFilters: PaymentStatus[];
  onPaymentFiltersChange: (values: PaymentStatus[]) => void;
}

export const OrderFiltersModal: React.FC<OrderFiltersModalProps> = ({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  statusFilters,
  onStatusFiltersChange,
  paymentFilters,
  onPaymentFiltersChange,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Filter" size="md">
    <div className="flex flex-col h-full bg-surface">
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="mb-6">
          <OverlaySearchInput
            value={searchQuery}
            onChange={onSearchChange}
            placeholder={ORDER_FILTER_PLACEHOLDERS.search}
          />
        </div>

        <div className="space-y-5">
          <div className="w-full">
            <h4 className="text-sm font-semibold text-text-primary mb-3">Date Range</h4>
            <DatePresetBadges value={dateRange} onChange={onDateRangeChange} />
            <div className="border-b border-border-default mt-4" />
          </div>

          <div className="w-full">
            <h4 className="text-sm font-semibold text-text-primary mb-3">Order Status</h4>
            <CheckboxList
              options={orderStatusOptions}
              selectedIds={statusFilters}
              onChange={values => onStatusFiltersChange(values as OrderStatus[])}
              columns={orderStatusOptions.length > 4 ? 2 : 1}
            />
            <div className="border-b border-border-default mt-4" />
          </div>

          <div className="w-full">
            <h4 className="text-sm font-semibold text-text-primary mb-3">Payment Status</h4>
            <CheckboxList
              options={paymentStatusOptions}
              selectedIds={paymentFilters}
              onChange={values => onPaymentFiltersChange(values as PaymentStatus[])}
              columns={paymentStatusOptions.length > 4 ? 2 : 1}
            />
          </div>
        </div>
      </div>

      <FilterModalFooter
        onReset={() => {
          onDateRangeChange(null);
          onStatusFiltersChange([]);
          onPaymentFiltersChange([]);
        }}
        onApply={onClose}
      />
    </div>
  </Modal>
);
