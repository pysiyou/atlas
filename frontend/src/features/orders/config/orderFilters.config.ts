/**
 * Order list filter configuration for FilterBar component.
 */

import type { FilterConfig } from '@/components/filters/types';
import { IconKeys } from '@/config/icons';
import { createFilterOptions } from '@/utils/filtering';
import { ORDER_STATUS_VALUES, ORDER_STATUS_CONFIG } from '@/types';
import { ORDER_FILTER_PLACEHOLDERS } from '@/config/filterPlaceholders';

const orderStatusOptions = createFilterOptions(ORDER_STATUS_VALUES, ORDER_STATUS_CONFIG);

export const orderFilterConfig: FilterConfig = {
  footerIcon: IconKeys.modules.orders,
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
        key: 'dateRange',
        type: 'dateRange',
        label: 'Order Date Range',
        icon: IconKeys.dataFields.date,
      },
      {
        key: 'status',
        type: 'multiSelect',
        label: 'Order Status',
        options: orderStatusOptions,
        icon: IconKeys.domain.orderStatus,
      },
    ],
  },
};

/** Entity filter keys that sync to URL for cross-page navigation. */
export const ORDER_URL_FILTER_KEYS = ['patientId', 'orderId'] as const;
