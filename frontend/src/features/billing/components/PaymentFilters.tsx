/**
 * PaymentFilters Component
 * Responsive filter controls with modal for smaller screens
 */

import React, { useState } from 'react';
import { useBreakpoint, isBreakpointAtMost } from '@/hooks/useBreakpoint';
import {
  ResponsiveFilterMobileBar,
  PAYMENT_FILTER_PLACEHOLDERS,
} from '@/features/filters';
import { PaymentFiltersInlineControls } from './PaymentFiltersInlineControls';
import { PaymentFiltersModal } from './PaymentFiltersModal';
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

/**
 * PaymentFilters - Responsive filter layout
 * - lg+: 4-column grid (search + date + status + method)
 * - md: 2-column grid (search + date in row 1, status + method in row 2)
 * - sm/xs: Search bar + Filters button (opens modal with all filters)
 */
export const PaymentFilters: React.FC<PaymentFiltersProps> = props => {
  const breakpoint = useBreakpoint();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const activeFilterCount =
    (props.dateRange ? 1 : 0) + props.statusFilters.length + props.methodFilters.length;

  const showModalView = isBreakpointAtMost(breakpoint, 'sm');
  const showTwoColumn = breakpoint === 'md';

  if (showModalView) {
    return (
      <>
        <ResponsiveFilterMobileBar
          searchQuery={props.searchQuery}
          onSearchChange={props.onSearchChange}
          searchPlaceholder={PAYMENT_FILTER_PLACEHOLDERS.search}
          activeFilterCount={activeFilterCount}
          onOpenModal={() => setIsModalOpen(true)}
        />
        <PaymentFiltersModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          {...props}
        />
      </>
    );
  }

  const inlineControls = <PaymentFiltersInlineControls {...props} />;

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
