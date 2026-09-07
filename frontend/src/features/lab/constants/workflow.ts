/**
 * Lab workflow filter configurations.
 */

import type { PriorityLevel } from '@/types';
import type { FilterOption } from '@/utils/filtering';
import { createFilterOptions } from '@/utils/filtering';
import {
  TEST_STATUS_CONFIG,
  PRIORITY_LEVEL_VALUES,
  PRIORITY_LEVEL_CONFIG,
} from '@/types';
import { ICONS } from '@/config/icons';
import { SHARED_FILTER_PLACEHOLDERS } from '@/components/filters';
import { buildLabFilterConfig } from '../utils/buildLabFilterConfig';

const COLLECTION_STATUS_OPTIONS: FilterOption[] = [
  { id: 'pending', label: 'Pending', color: 'pending' },
  { id: 'collected', label: 'Collected', color: 'collected' },
  { id: 'rejected', label: 'Rejected', color: 'rejected' },
];

export const collectionFilterConfig = buildLabFilterConfig({
  searchPlaceholder: 'Search samples by order ID, sample ID, patient, or test...',
  searchHelpText: 'Search by order ID, sample ID, patient name, or test name.',
  dateRangeHelpText: 'Filter samples by collection or order date range.',
  extraControls: [
    {
      type: 'multiSelect',
      key: 'status',
      label: 'Status',
      options: COLLECTION_STATUS_OPTIONS,
      selectAllLabel: 'All statuses',
      icon: ICONS.sampleStatus,
      placeholder: SHARED_FILTER_PLACEHOLDERS.status,
      helpText: 'Filter by collection status: Pending, Collected, or Rejected.',
    },
  ],
});

const ENTRY_STATUS_VALUES = ['sample-collected'] as const;
const entryStatusOptions = createFilterOptions(ENTRY_STATUS_VALUES, {
  'sample-collected': { label: TEST_STATUS_CONFIG['sample-collected'].label },
} as Record<(typeof ENTRY_STATUS_VALUES)[number], { label: string }>);

export const entryFilterConfig = buildLabFilterConfig({
  searchPlaceholder: 'Search tests by order ID, patient, or test name...',
  searchHelpText: 'Search by order ID, patient name, or test name.',
  dateRangeHelpText: 'Filter by order or result date range.',
  extraControls: [
    {
      type: 'multiSelect',
      key: 'status',
      label: 'Status',
      options: entryStatusOptions,
      selectAllLabel: 'All statuses',
      icon: ICONS.testStatus,
      placeholder: SHARED_FILTER_PLACEHOLDERS.status,
      helpText: 'Filter by test status: Sample Collected.',
    },
  ],
});

const priorityOptions = createFilterOptions(PRIORITY_LEVEL_VALUES, {
  low: { label: PRIORITY_LEVEL_CONFIG.low.label },
  medium: { label: PRIORITY_LEVEL_CONFIG.medium.label },
  high: { label: PRIORITY_LEVEL_CONFIG.high.label },
  urgent: { label: PRIORITY_LEVEL_CONFIG.urgent.label },
} as Record<PriorityLevel, { label: string }>);

export const validationFilterConfig = buildLabFilterConfig({
  searchPlaceholder: 'Search tests by order ID, patient, or test name...',
  searchHelpText: 'Search by order ID, patient name, or test name.',
  dateRangeHelpText: 'Filter by order or validation date range.',
  extraControls: [
    {
      type: 'multiSelect',
      key: 'priority',
      label: 'Priority',
      options: priorityOptions,
      selectAllLabel: 'All priorities',
      icon: ICONS.priority,
      placeholder: 'All priorities',
      helpText: 'Filter by priority level: Low, Medium, High, or Urgent.',
    },
  ],
});
