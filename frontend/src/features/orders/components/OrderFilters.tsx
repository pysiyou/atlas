/**
 * OrderFilters Component
 * Responsive filter controls with modal for smaller screens
 */

import React from 'react';
import { CheckboxList } from '@/components';
import {
  ResponsiveEntityFilters,
  DatePresetBadges,
  ORDER_FILTER_PLACEHOLDERS,
} from '@/components/filters';
import {
  ORDER_STATUS_VALUES,
  PAYMENT_STATUS_VALUES,
  ORDER_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
} from '@/types';
import { createFilterOptions } from '@/utils/filtering';
import { MODULE_ICONS } from '@/config/icons';
import { OrderFiltersInlineControls } from './OrderFiltersInlineControls';
import type { OrderStatus, PaymentStatus } from '@/types';

const orderStatusOptions = createFilterOptions(ORDER_STATUS_VALUES, ORDER_STATUS_CONFIG);
const paymentStatusOptions = createFilterOptions(PAYMENT_STATUS_VALUES, PAYMENT_STATUS_CONFIG);

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

export const OrderFilters: React.FC<OrderFiltersProps> = props => {
  const activeFilterCount =
    (props.dateRange ? 1 : 0) + props.statusFilters.length + props.paymentFilters.length;

  const modalContent = (
    <>
      <div className="w-full">
        <h4 className="text-sm font-semibold text-text-primary mb-3">Date Range</h4>
        <DatePresetBadges value={props.dateRange} onChange={props.onDateRangeChange} />
        <div className="border-b border-border-default mt-4" />
      </div>
      <div className="w-full">
        <h4 className="text-sm font-semibold text-text-primary mb-3">Order Status</h4>
        <CheckboxList
          options={orderStatusOptions}
          selectedIds={props.statusFilters}
          onChange={values => props.onStatusFiltersChange(values as OrderStatus[])}
          columns={orderStatusOptions.length > 4 ? 2 : 1}
        />
        <div className="border-b border-border-default mt-4" />
      </div>
      <div className="w-full">
        <h4 className="text-sm font-semibold text-text-primary mb-3">Payment Status</h4>
        <CheckboxList
          options={paymentStatusOptions}
          selectedIds={props.paymentFilters}
          onChange={values => props.onPaymentFiltersChange(values as PaymentStatus[])}
          columns={paymentStatusOptions.length > 4 ? 2 : 1}
        />
      </div>
    </>
  );

  return (
    <ResponsiveEntityFilters
      searchQuery={props.searchQuery}
      onSearchChange={props.onSearchChange}
      searchPlaceholder={ORDER_FILTER_PLACEHOLDERS.search}
      activeFilterCount={activeFilterCount}
      inlineControls={<OrderFiltersInlineControls {...props} />}
      modalContent={modalContent}
      footerIcon={MODULE_ICONS.orders}
      footerLabel="Orders"
      onReset={() => {
        props.onDateRangeChange(null);
        props.onStatusFiltersChange([]);
        props.onPaymentFiltersChange([]);
      }}
      searchRowHeight="h-9"
    />
  );
};
