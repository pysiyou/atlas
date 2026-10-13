/**
 * Order list filter configuration for FilterBar component.
 */

import type { FilterConfig } from '@/components/filters/types';
import { MODULE_ICONS } from '@/config/icons';
import { createFilterOptions } from '@/utils/filtering';
import {
  ORDER_STATUS_VALUES,
  PAYMENT_STATUS_VALUES,
  ORDER_STATUS_CONFIG,
  PAYMENT_STATUS_CONFIG,
} from '@/types';
import { ORDER_FILTER_PLACEHOLDERS } from '@/components/filters';

const orderStatusOptions = createFilterOptions(ORDER_STATUS_VALUES, ORDER_STATUS_CONFIG);
const paymentStatusOptions = createFilterOptions(PAYMENT_STATUS_VALUES, PAYMENT_STATUS_CONFIG);

export const orderFilterConfig: FilterConfig = {
  footerIcon: MODULE_ICONS.orders,
  footerLabel: 'Orders',
  primaryFilters: {
    title: 'Order Filters',
    controls: [
      {
        key: 'search',
        type: 'search',
        label: 'Search Orders',
        placeholder: ORDER_FILTER_PLACEHOLDERS.search,
      },
      {
        key: 'status',
        type: 'multiSelect',
        label: 'Order Status',
        options: orderStatusOptions,
      },
      {
        key: 'paymentStatus',
        type: 'multiSelect',
        label: 'Payment Status',
        options: paymentStatusOptions,
      },
    ],
  },
  advancedFilters: {
    title: 'Advanced Filters',
    controls: [
      {
        key: 'dateRange',
        type: 'dateRange',
        label: 'Order Date Range',
      },
    ],
  },
};

/** Entity filter keys that sync to URL for cross-page navigation. */
export const ORDER_URL_FILTER_KEYS = ['patientId', 'orderId'] as const;
