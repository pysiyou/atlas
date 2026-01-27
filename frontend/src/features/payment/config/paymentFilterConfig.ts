/**
 * Payment Filter Configuration
 * Config-driven filter setup for payment list page
 */

import type { FilterConfig } from '@/utils/filters';
import type { PaymentMethod } from '@/types';
import { PAYMENT_STATUS_VALUES, PAYMENT_STATUS_CONFIG } from '@/types';
import { createFilterOptions } from '@/utils/filters';
import { getEnabledPaymentMethods } from '@/types/billing';
import { ICONS } from '@/utils/icon-mappings';

/**
 * Payment status filter options
 */
const statusOptions = createFilterOptions(PAYMENT_STATUS_VALUES, PAYMENT_STATUS_CONFIG);

/**
 * Payment method configuration
 */
const PAYMENT_METHOD_CONFIG: Record<PaymentMethod, { label: string }> = {
  cash: { label: 'Cash' },
  'credit-card': { label: 'Credit Card' },
  'debit-card': { label: 'Debit Card' },
  insurance: { label: 'Insurance' },
  'bank-transfer': { label: 'Bank Transfer' },
  'mobile-money': { label: 'Mobile Money' },
};

/**
 * Payment method filter options
 */
const methodOptions = createFilterOptions(
  getEnabledPaymentMethods().map(m => m.value) as PaymentMethod[],
  PAYMENT_METHOD_CONFIG
);

/**
 * Payment filter configuration
 */
export const paymentFilterConfig: FilterConfig = {
  quickFilters: [],
  primaryFilters: {
    title: 'Filters',
    collapsible: false,
    controls: [
      {
        type: 'search',
        key: 'searchQuery',
        label: 'Search',
        placeholder: 'Search payments by order ID or patient name...',
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
        key: 'paymentStatus',
        label: 'Payment Status',
        options: statusOptions,
        selectAllLabel: 'All statuses',
        icon: ICONS.actions.infoCircle,
        placeholder: 'Select payment status',
      },
      {
        type: 'multiSelect',
        key: 'paymentMethod',
        label: 'Payment Method',
        options: methodOptions,
        selectAllLabel: 'All methods',
        icon: ICONS.dataFields.wallet,
        placeholder: 'Select payment method',
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
