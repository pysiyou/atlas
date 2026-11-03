/**
 * Payment list filter configuration for FilterBar.
 */

import type { FilterConfig } from '@/components/filters/types';
import { IconKeys } from '@/config/icons';
import { createFilterOptions } from '@/utils/filtering';
import { PAYMENT_STATUS_VALUES, PAYMENT_STATUS_CONFIG } from '@/types';
import { PAYMENT_FILTER_PLACEHOLDERS } from '@/config/filterPlaceholders';

const statusOptions = createFilterOptions(PAYMENT_STATUS_VALUES, PAYMENT_STATUS_CONFIG);

export const paymentFilterConfig: FilterConfig = {
  footerIcon: IconKeys.modules.payments,
  footerLabel: 'Payments',
  primaryFilters: {
    title: 'Payment Filters',
    controls: [
      {
        key: 'search',
        type: 'search',
        label: 'Search Payments',
        placeholder: PAYMENT_FILTER_PLACEHOLDERS.search,
      },
      {
        key: 'dateRange',
        type: 'dateRange',
        label: 'Payment Date Range',
        icon: IconKeys.dataFields.date,
      },
      {
        key: 'statusFilters',
        type: 'multiSelect',
        label: 'Payment Status',
        options: statusOptions,
        icon: IconKeys.domain.paymentStatus,
      },
    ],
  },
};

/** Entity filter keys that sync to URL for cross-page navigation. */
export const PAYMENT_URL_FILTER_KEYS = ['orderId', 'patientId'] as const;
