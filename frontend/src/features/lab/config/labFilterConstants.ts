/**
 * Lab Filter Constants
 * Shared filter options for collection, entry, and validation tabs.
 * Matches catalog/order filter structure (search, dateRange, sampleType, status).
 */

import type { FilterOption } from '@/utils/filtering';
import { SAMPLE_TYPE_VALUES, SAMPLE_TYPE_CONFIG } from '@/types';

/** Sample type filter options – same as catalog, FilterOption format */
export const LAB_SAMPLE_TYPE_OPTIONS: FilterOption[] = SAMPLE_TYPE_VALUES.map(
  (st): FilterOption => ({
    id: st,
    label: SAMPLE_TYPE_CONFIG[st].label,
    color: st,
  })
);
