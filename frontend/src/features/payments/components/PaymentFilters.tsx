/**
 * PaymentFilters Component
 * Responsive filter controls with modal for smaller screens
 */

import React from 'react';
import { CheckboxList } from '@/components';
import {
  ResponsiveEntityFilters,
  DatePresetBadges,
  PAYMENT_FILTER_PLACEHOLDERS,
} from '@/components/filters';
import { PAYMENT_STATUS_VALUES, PAYMENT_STATUS_CONFIG } from '@/types';
import { createFilterOptions } from '@/utils/filtering';
import { getEnabledPaymentMethods } from '@/types/payments';
import { MODULE_ICONS } from '@/config/icons';
import { PaymentFiltersInlineControls } from './PaymentFiltersInlineControls';
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

export const PaymentFilters: React.FC<PaymentFiltersProps> = props => {
  const activeFilterCount =
    (props.dateRange ? 1 : 0) + props.statusFilters.length + props.methodFilters.length;

  const modalContent = (
    <>
      <div className="w-full">
        <h4 className="text-sm font-semibold text-text-primary mb-3">Date Range</h4>
        <DatePresetBadges value={props.dateRange} onChange={props.onDateRangeChange} />
        <div className="border-b border-border-default mt-4" />
      </div>
      <div className="w-full">
        <h4 className="text-sm font-semibold text-text-primary mb-3">Payment Status</h4>
        <CheckboxList
          options={statusOptions}
          selectedIds={props.statusFilters}
          onChange={values => props.onStatusFiltersChange(values as PaymentStatus[])}
          columns={statusOptions.length > 4 ? 2 : 1}
        />
        <div className="border-b border-border-default mt-4" />
      </div>
      <div className="w-full">
        <h4 className="text-sm font-semibold text-text-primary mb-3">Payment Method</h4>
        <CheckboxList
          options={methodOptions}
          selectedIds={props.methodFilters}
          onChange={values => props.onMethodFiltersChange(values as PaymentMethod[])}
          columns={methodOptions.length > 4 ? 2 : 1}
        />
      </div>
    </>
  );

  return (
    <ResponsiveEntityFilters
      searchQuery={props.searchQuery}
      onSearchChange={props.onSearchChange}
      searchPlaceholder={PAYMENT_FILTER_PLACEHOLDERS.search}
      activeFilterCount={activeFilterCount}
      inlineControls={<PaymentFiltersInlineControls {...props} />}
      modalContent={modalContent}
      footerIcon={MODULE_ICONS.payments}
      footerLabel="Payments"
      onReset={() => {
        props.onDateRangeChange(null);
        props.onStatusFiltersChange([]);
        props.onMethodFiltersChange([]);
      }}
    />
  );
};
