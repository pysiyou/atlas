/**
 * Payment Filter Configuration
 * Config-driven filter setup for payments page
 */

import type { FilterConfig } from '@/features/filters';
import type { PaymentMethod } from '@/types';
import { PAYMENT_STATUS_VALUES, PAYMENT_STATUS_CONFIG } from '@/types';
import { createFilterOptions } from '@/utils/filtering';

/**
 * Prepare filter options for payment status
 */
const paymentStatusOptions = createFilterOptions(
  PAYMENT_STATUS_VALUES,
  PAYMENT_STATUS_CONFIG
);

/**
 * Currently enabled payment methods
 * Note: Only Cash and Mobile Money are active
 * TODO: Enable other payment methods when backend support is ready
 */
const PAYMENT_METHOD_VALUES: PaymentMethod[] = ['cash', 'mobile-money'];

/**
 * Payment method configuration for filter display
 * Maps method IDs to human-readable labels and visual styling
 */
const PAYMENT_METHOD_CONFIG: Record<PaymentMethod, { label: string; color: string }> = {
  cash: { label: 'Cash', color: 'cash' },
  'credit-card': { label: 'Credit Card', color: 'credit-card' },
  'debit-card': { label: 'Debit Card', color: 'debit-card' },
  insurance: { label: 'Insurance', color: 'insurance' },
  'bank-transfer': { label: 'Bank Transfer', color: 'bank-transfer' },
  'mobile-money': { label: 'Mobile Money', color: 'mobile-money' },
};

/**
 * Prepare filter options for payment method
 */
const paymentMethodOptions = createFilterOptions(
  PAYMENT_METHOD_VALUES,
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
        placeholder: 'Search payments by transaction ID, patient name, or reference...',
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
        label: 'Payment Status',
        options: paymentStatusOptions,
        selectAllLabel: 'All statuses',
        icon: 'info-circle',
        placeholder: 'Select payment status',
      },
      {
        type: 'multiSelect',
        key: 'method',
        label: 'Payment Method',
        options: paymentMethodOptions,
        selectAllLabel: 'All methods',
        icon: 'wallet',
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
