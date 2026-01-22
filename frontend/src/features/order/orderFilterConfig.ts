/**
 * Order Filter Configuration
 * Config-driven filter setup for orders page
 */

import type { FilterConfig } from '@/features/filters';
import { createFilterOptions } from '@/utils/filtering';
import {
  ORDER_STATUS_VALUES,
  PAYMENT_STATUS_VALUES,
  ORDER_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
} from '@/types';

/**
 * Prepare filter options for order status
 */
const orderStatusOptions = createFilterOptions(
  ORDER_STATUS_VALUES,
  ORDER_STATUS_CONFIG
);

/**
 * Prepare filter options for payment status
 */
const paymentStatusOptions = createFilterOptions(
  PAYMENT_STATUS_VALUES,
  PAYMENT_STATUS_CONFIG
);

/**
 * Order filter configuration
 */
export const orderFilterConfig: FilterConfig = {
  quickFilters: [],
  primaryFilters: {
    title: 'Filters',
    collapsible: false,
    controls: [
      {
        type: 'search',
        key: 'searchQuery',
        label: 'Search',
        placeholder: 'Search orders by ID, patient name, or details...',
        debounceMs: 300,
      },
      {
        type: 'dateRange',
        key: 'dateRange',
        label: 'Date Range',
        placeholder: 'Filter by date range',
        icon: 'calendar',
      },
      {
        type: 'multiSelect',
        key: 'status',
        label: 'Order Status',
        options: orderStatusOptions,
        selectAllLabel: 'All statuses',
        icon: 'info-circle',
        placeholder: 'Select order status',
      },
      {
        type: 'multiSelect',
        key: 'payment',
        label: 'Payment Status',
        options: paymentStatusOptions,
        selectAllLabel: 'All payment statuses',
        icon: 'wallet',
        placeholder: 'Select payment status',
      },
    ],
  },
  advancedFilters: {
    title: 'Advanced Filters',
    collapsible: true,
    defaultCollapsed: true,
    controls: [],
  },
};
