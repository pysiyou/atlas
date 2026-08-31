/**
 * OrderFilters Component
 * Responsive filter controls with modal for smaller screens
 */

import React, { useState } from 'react';
import { useBreakpoint, isBreakpointAtMost } from '@/hooks/useBreakpoint';
import { ResponsiveFilterMobileBar, ORDER_FILTER_PLACEHOLDERS } from '@/filters';
import { OrderFiltersInlineControls } from './OrderFiltersInlineControls';
import { OrderFiltersModal } from './OrderFiltersModal';
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

/**
 * OrderFilters - Responsive filter layout
 * - lg+: 4-column grid (search + date + order status + payment status)
 * - md: 2-column grid
 * - sm/xs: Search bar + Filters button (opens modal with all filters)
 */
export const OrderFilters: React.FC<OrderFiltersProps> = props => {
  const breakpoint = useBreakpoint();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const activeFilterCount =
    (props.dateRange ? 1 : 0) + props.statusFilters.length + props.paymentFilters.length;

  const showModalView = isBreakpointAtMost(breakpoint, 'sm');
  const showTwoColumn = breakpoint === 'md';

  if (showModalView) {
    return (
      <>
        <ResponsiveFilterMobileBar
          searchQuery={props.searchQuery}
          onSearchChange={props.onSearchChange}
          searchPlaceholder={ORDER_FILTER_PLACEHOLDERS.search}
          activeFilterCount={activeFilterCount}
          onOpenModal={() => setIsModalOpen(true)}
          searchRowHeight="h-9"
        />
        <OrderFiltersModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          {...props}
        />
      </>
    );
  }

  const inlineControls = <OrderFiltersInlineControls {...props} />;

  if (showTwoColumn) {
    return (
      <div className="w-full bg-surface border-b border-border-default">
        <div className="px-3 py-2 w-full">
          <div className="grid grid-cols-2 gap-2 items-center w-full">{inlineControls}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-surface border-b border-border-default">
      <div className="px-4 py-2.5 lg:px-5 lg:py-3 w-full">
        <div className="grid grid-cols-4 gap-3 lg:gap-4 items-center w-full">{inlineControls}</div>
      </div>
    </div>
  );
};
