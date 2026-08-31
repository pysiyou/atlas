/**
 * Lab Feature Constants and Filter Configurations
 *
 * Centralized constants for lab workflows including filter configurations
 * for collection, entry, and validation.
 */

import type { SampleStatus, TestStatus, PriorityLevel } from '@/types';
import type { FilterOption } from '@/utils/filtering';
import { createFilterOptions } from '@/utils/filtering';
import {
  SAMPLE_TYPE_VALUES,
  SAMPLE_TYPE_CONFIG,
  TEST_STATUS_CONFIG,
  PRIORITY_LEVEL_VALUES,
  PRIORITY_LEVEL_CONFIG,
} from '@/types';
import { ICONS } from '@/utils';
import { SHARED_FILTER_PLACEHOLDERS } from '@/components/filters';
import { buildLabFilterConfig } from '@/features/lab/utils/buildLabFilterConfig';

// ============================================================================
// Status Constants
// ============================================================================

/**
 * Sample status values used in lab workflows
 */
export const LAB_SAMPLE_STATUSES = {
  PENDING: 'pending' as SampleStatus,
  COLLECTED: 'collected' as SampleStatus,
  REJECTED: 'rejected' as SampleStatus,
} as const;

/**
 * Test status values used in lab workflows
 */
export const LAB_TEST_STATUSES = {
  PENDING: 'pending' as TestStatus,
  SAMPLE_COLLECTED: 'sample-collected' as TestStatus,
  IN_PROGRESS: 'in-progress' as TestStatus,
  RESULTED: 'resulted' as TestStatus,
  VALIDATED: 'validated' as TestStatus,
  REJECTED: 'rejected' as TestStatus,
  ESCALATED: 'escalated' as TestStatus,
  SUPERSEDED: 'superseded' as TestStatus,
  REMOVED: 'removed' as TestStatus,
} as const;

/**
 * Filter options for lab workflows
 */
export const LAB_FILTER_OPTIONS = {
  STATUS: Object.values(LAB_SAMPLE_STATUSES),
} as const;

// ============================================================================
// Shared Filter Options
// ============================================================================

/** Sample type filter options - shared across all lab workflows */
export const LAB_SAMPLE_TYPE_OPTIONS: FilterOption[] = SAMPLE_TYPE_VALUES.map(
  (st): FilterOption => ({
    id: st,
    label: SAMPLE_TYPE_CONFIG[st].label,
    color: st,
  })
);

// ============================================================================
// Collection Workflow Filter Config
// ============================================================================

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

// ============================================================================
// Entry Workflow Filter Config
// ============================================================================

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
      helpText: 'Filter by test status: Sample Collected or In Progress.',
    },
  ],
});

// ============================================================================
// Validation Workflow Filter Config
// ============================================================================

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
