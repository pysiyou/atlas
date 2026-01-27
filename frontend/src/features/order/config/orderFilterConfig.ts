/**
 * Order Filter Configuration
 * Config-driven filter setup for order list page
 */

import type { FilterConfig } from '@/utils/filters';
import {
  ORDER_STATUS_VALUES,
  PAYMENT_STATUS_VALUES,
  ORDER_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
} from '@/types';
import { createFilterOptions } from '@/utils/filters';
import { ICONS } from '@/utils/icon-mappings';

/**
 * Order status filter options
 */
const orderStatusOptions = createFilterOptions(ORDER_STATUS_VALUES, ORDER_STATUS_CONFIG);

/**
 * Payment status filter options
 */
const paymentStatusOptions = createFilterOptions(PAYMENT_STATUS_VALUES, PAYMENT_STATUS_CONFIG);

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
        icon: ICONS.dataFields.date,
      },
      {
        type: 'multiSelect',
        key: 'overallStatus',
        label: 'Order Status',
        options: orderStatusOptions,
        selectAllLabel: 'All statuses',
        icon: ICONS.actions.infoCircle,
        placeholder: 'Select order status',
      },
      {
        type: 'multiSelect',
        key: 'paymentStatus',
        label: 'Payment Status',
        options: paymentStatusOptions,
        selectAllLabel: 'All payment statuses',
        icon: ICONS.dataFields.wallet,
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
