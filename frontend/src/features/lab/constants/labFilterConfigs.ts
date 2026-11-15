/**
 * Lab queue filter configurations.
 */

import type { PriorityLevel } from '@/types';
import type { FilterOption } from '@/utils/filtering';
import { createFilterOptions } from '@/utils/filtering';
import {
  TEST_STATUS_CONFIG,
  PRIORITY_LEVEL_VALUES,
  PRIORITY_LEVEL_CONFIG,
  TEST_STATUS_VALUES,
} from '@/types';
import { IconKeys } from '@/icons';
import { getSharedFilterPlaceholders, getLabQueueFilterPlaceholders } from '@/strings';
import { buildLabFilterConfig } from '../utils/buildLabFilterConfig';

const PRIORITY_GROUP_OPTIONS: FilterOption[] = [
  { id: 'stat', label: 'STAT' },
  { id: 'routine', label: 'Routine' },
];

const priorityGroupControl = {
  type: 'multiSelect' as const,
  key: 'priorityGroup',
  label: 'STAT / Routine',
  options: PRIORITY_GROUP_OPTIONS,
  selectAllLabel: 'All urgencies',
  icon: IconKeys.domain.priority,
  placeholder: 'STAT or Routine',
  helpText: 'STAT is urgent; Routine is low, medium, and high.',
};

const COLLECTION_STATUS_OPTIONS: FilterOption[] = [
  { id: 'pending', label: 'Pending', color: 'pending' },
  { id: 'collected', label: 'Collected', color: 'collected' },
  { id: 'rejected', label: 'Rejected', color: 'rejected' },
];

export function getCollectionFilterConfig() {
  const ph = getLabQueueFilterPlaceholders().collection;
  const shared = getSharedFilterPlaceholders();

  return buildLabFilterConfig({
    searchPlaceholder: ph.searchPlaceholder,
    searchHelpText: ph.searchHelpText,
    dateRangeHelpText: ph.dateRangeHelpText,
    extraControls: [
      priorityGroupControl,
      {
        type: 'multiSelect',
        key: 'status',
        label: 'Status',
        options: COLLECTION_STATUS_OPTIONS,
        selectAllLabel: 'All statuses',
        icon: IconKeys.domain.sampleStatus,
        placeholder: shared.status,
        helpText: 'Filter by collection status: Pending, Collected, or Rejected.',
      },
    ],
  });
}

const ENTRY_STATUS_VALUES = ['sample-collected'] as const;
const entryStatusOptions = createFilterOptions(ENTRY_STATUS_VALUES, {
  'sample-collected': { label: TEST_STATUS_CONFIG['sample-collected'].label },
} as Record<(typeof ENTRY_STATUS_VALUES)[number], { label: string }>);

export function getEntryFilterConfig() {
  const ph = getLabQueueFilterPlaceholders().entry;
  const shared = getSharedFilterPlaceholders();

  return buildLabFilterConfig({
    searchPlaceholder: ph.searchPlaceholder,
    searchHelpText: ph.searchHelpText,
    dateRangeHelpText: ph.dateRangeHelpText,
    extraControls: [
      priorityGroupControl,
      {
        type: 'multiSelect',
        key: 'status',
        label: 'Status',
        options: entryStatusOptions,
        selectAllLabel: 'All statuses',
        icon: IconKeys.domain.testStatus,
        placeholder: shared.status,
        helpText: 'Filter by test status: Sample Collected.',
      },
    ],
  });
}

const priorityOptions = createFilterOptions(PRIORITY_LEVEL_VALUES, {
  low: { label: PRIORITY_LEVEL_CONFIG.low.label },
  medium: { label: PRIORITY_LEVEL_CONFIG.medium.label },
  high: { label: PRIORITY_LEVEL_CONFIG.high.label },
  urgent: { label: PRIORITY_LEVEL_CONFIG.urgent.label },
} as Record<PriorityLevel, { label: string }>);

export function getValidationFilterConfig() {
  const ph = getLabQueueFilterPlaceholders().validation;

  return buildLabFilterConfig({
    searchPlaceholder: ph.searchPlaceholder,
    searchHelpText: ph.searchHelpText,
    dateRangeHelpText: ph.dateRangeHelpText,
    extraControls: [
      priorityGroupControl,
      {
        type: 'multiSelect',
        key: 'priority',
        label: 'Priority',
        options: priorityOptions,
        selectAllLabel: 'All priorities',
        icon: IconKeys.domain.priority,
        placeholder: 'All priorities',
        helpText: 'Filter by priority level: Low, Medium, High, or Urgent.',
      },
    ],
  });
}

const allTestsStatusOptions = createFilterOptions(TEST_STATUS_VALUES, TEST_STATUS_CONFIG);

export function getAllTestsFilterConfig() {
  const ph = getLabQueueFilterPlaceholders().allTests;
  const shared = getSharedFilterPlaceholders();

  return buildLabFilterConfig({
    searchPlaceholder: ph.searchPlaceholder,
    searchHelpText: ph.searchHelpText,
    dateRangeHelpText: ph.dateRangeHelpText,
    extraControls: [
      {
        type: 'multiSelect',
        key: 'status',
        label: 'Status',
        options: allTestsStatusOptions,
        selectAllLabel: 'All statuses',
        icon: IconKeys.domain.testStatus,
        placeholder: shared.status,
        helpText: 'Filter by test lifecycle status.',
      },
      {
        type: 'multiSelect',
        key: 'priority',
        label: 'Priority',
        options: priorityOptions,
        selectAllLabel: 'All priorities',
        icon: IconKeys.domain.priority,
        placeholder: 'All priorities',
        helpText: 'Filter by priority level: Low, Medium, High, or Urgent.',
      },
    ],
  });
}
