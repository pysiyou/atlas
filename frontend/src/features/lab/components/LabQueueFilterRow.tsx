/**
 * LabQueueFilterRow — URL badges, FilterBar, and optional worklist pagination notice.
 */

import type { ReactNode } from 'react';
import { EntityUrlFilterBar } from '@/components/filters';
import type { UrlFilterKey, UrlFilters } from '@/utils/filters';
import type { WorklistPagination } from '../api/worklists';
import { LabWorklistPaginationNotice } from './LabWorklistPaginationNotice';
import { LAB_URL_FILTER_KEYS } from '../constants/labFilterConfigs';

export interface LabQueueFilterRowProps<K extends UrlFilterKey = (typeof LAB_URL_FILTER_KEYS)[number]> {
  urlFilters: UrlFilters;
  urlFilterKeys?: readonly K[];
  onClearUrlFilters: () => void;
  onClearUrlFilter: (key: K) => void;
  pagination?: WorklistPagination;
  children: ReactNode;
}

/**
 * Shared filter chrome for collection, entry, and validation queues.
 */
export function LabQueueFilterRow<K extends UrlFilterKey = (typeof LAB_URL_FILTER_KEYS)[number]>({
  urlFilters,
  urlFilterKeys = LAB_URL_FILTER_KEYS as unknown as readonly K[],
  onClearUrlFilters,
  onClearUrlFilter,
  pagination,
  children,
}: LabQueueFilterRowProps<K>) {
  return (
    <>
      <EntityUrlFilterBar
        urlFilters={urlFilters}
        urlFilterKeys={urlFilterKeys}
        onClear={onClearUrlFilters}
        onClearSingle={onClearUrlFilter}
      />
      {children}
      {pagination ? <LabWorklistPaginationNotice pagination={pagination} /> : null}
    </>
  );
}
