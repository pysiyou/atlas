/**
 * Lab Feature Constants and Filter Configurations
 *
 * Centralized constants for lab workflows including filter configurations
 * for collection, entry, and validation.
 */

import type { SampleStatus, TestStatus, PriorityLevel } from '@/types';
import type { FilterConfig } from '@/utils/filters';
import type { FilterOption } from '@/utils/filters';
import { createFilterOptions } from '@/utils/filters';
import {
  SAMPLE_TYPE_VALUES,
  SAMPLE_TYPE_CONFIG,
  TEST_STATUS_CONFIG,
  PRIORITY_LEVEL_VALUES,
  PRIORITY_LEVEL_CONFIG,
} from '@/types';
import { ICONS } from '@/utils/icon-mappings';

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
  SAMPLE_COLLECTED: 'sample-collected' as SampleStatus,
  IN_PROGRESS: 'in-progress' as SampleStatus,
  RESULTED: 'resulted' as TestStatus,
} as const;

/**
 * Test status values used in lab workflows
 */
export const LAB_TEST_STATUSES = {
  PENDING: 'pending' as TestStatus,
  IN_PROGRESS: 'in-progress' as TestStatus,
  COMPLETED: 'completed' as TestStatus,
  VALIDATED: 'validated' as TestStatus,
  REJECTED: 'rejected' as TestStatus,
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

/** Sample status for collection: pending, collected, rejected */
const COLLECTION_STATUS_OPTIONS: FilterOption[] = [
  { id: 'pending', label: 'PENDING', color: 'pending' },
  { id: 'collected', label: 'COLLECTED', color: 'collected' },
  { id: 'rejected', label: 'REJECTED', color: 'rejected' },
];

/** Collection filter configuration */
export const collectionFilterConfig: FilterConfig = {
  quickFilters: [],
  primaryFilters: {
    title: 'Filters',
    collapsible: false,
    controls: [
      {
        type: 'search',
        key: 'searchQuery',
        label: 'Search',
        placeholder: 'Search samples by order ID, sample ID, patient, or test...',
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
        key: 'sampleType',
        label: 'Sample Type',
        options: LAB_SAMPLE_TYPE_OPTIONS,
        selectAllLabel: 'All sample types',
        icon: ICONS.dataFields.sampleCollection,
        placeholder: 'Select sample type',
      },
      {
        type: 'multiSelect',
        key: 'status',
        label: 'Status',
        options: COLLECTION_STATUS_OPTIONS,
        selectAllLabel: 'All statuses',
        icon: ICONS.sampleStatus,
        placeholder: 'Select status',
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

// ============================================================================
// Entry Workflow Filter Config
// ============================================================================

/** Entry workflow: sample-collected, in-progress only */
const ENTRY_STATUS_VALUES = ['sample-collected', 'in-progress'] as const;
const entryStatusOptions = createFilterOptions(ENTRY_STATUS_VALUES, {
  'sample-collected': { label: TEST_STATUS_CONFIG['sample-collected'].label },
  'in-progress': { label: TEST_STATUS_CONFIG['in-progress'].label },
} as Record<(typeof ENTRY_STATUS_VALUES)[number], { label: string }>);

/** Entry filter configuration */
export const entryFilterConfig: FilterConfig = {
  quickFilters: [],
  primaryFilters: {
    title: 'Filters',
    collapsible: false,
    controls: [
      {
        type: 'search',
        key: 'searchQuery',
        label: 'Search',
        placeholder: 'Search tests by order ID, patient, or test name...',
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
        key: 'sampleType',
        label: 'Sample Type',
        options: LAB_SAMPLE_TYPE_OPTIONS,
        selectAllLabel: 'All sample types',
        icon: ICONS.dataFields.sampleCollection,
        placeholder: 'Select sample type',
      },
      {
        type: 'multiSelect',
        key: 'status',
        label: 'Status',
        options: entryStatusOptions,
        selectAllLabel: 'All statuses',
        icon: ICONS.testStatus,
        placeholder: 'Select status',
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

// ============================================================================
// Validation Workflow Filter Config
// ============================================================================

/** Priority options for validation workflow */
const priorityOptions = createFilterOptions(PRIORITY_LEVEL_VALUES, {
  routine: { label: PRIORITY_LEVEL_CONFIG.routine.label },
  urgent: { label: PRIORITY_LEVEL_CONFIG.urgent.label },
  stat: { label: PRIORITY_LEVEL_CONFIG.stat.label },
} as Record<PriorityLevel, { label: string }>);

/** Validation filter configuration */
export const validationFilterConfig: FilterConfig = {
  quickFilters: [],
  primaryFilters: {
    title: 'Filters',
    collapsible: false,
    controls: [
      {
        type: 'search',
        key: 'searchQuery',
        label: 'Search',
        placeholder: 'Search tests by order ID, patient, or test name...',
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
        key: 'sampleType',
        label: 'Sample Type',
        options: LAB_SAMPLE_TYPE_OPTIONS,
        selectAllLabel: 'All sample types',
        icon: ICONS.dataFields.sampleCollection,
        placeholder: 'Select sample type',
      },
      {
        type: 'multiSelect',
        key: 'status',
        label: 'Status',
        options: priorityOptions,
        selectAllLabel: 'All statuses',
        icon: ICONS.priority,
        placeholder: 'Select status',
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
