/**
 * SampleCollectionQueue - Main view for sample collection workflow
 */

import React, { useMemo } from 'react';
import { useBreakpoint, isBreakpointAtMost } from '@/hooks/useBreakpoint';
import {
  useLabQueueBarFilters,
  useLabQueueFilterBarProps,
  useLabQueuePageFilters,
} from '../hooks';
import type { CollectionQueueRow } from '@/types/lab-operations';
import { LAB_CONFIG } from '../constants';
import { useCollectSample } from '../api/samples';
import { useCollectionWorklist } from '../api/worklists';
import { useSubmitSampleCollection } from './useSubmitSampleCollection';
import { SampleCollectionCard } from '../workflow';
import { LabWorkflowQueueLayout } from '../components/LabWorkflowQueueLayout';
import { LabQueueFilters } from '../components/LabQueueFilters';
import { LabQueueFilterRow } from '../components/LabQueueFilterRow';
import { collectionFilterConfig } from '../constants';
import { worklistItemToQueueRow } from '../utils/worklistMappers';
import { EMPTY_COPY, emptySubtitle } from '@/components/display';
import { ErrorBoundary } from '@/feedback';
import { useAuthStore } from '@/app/authStore';
import { useTestCatalog } from '@/features/catalog';
import { useClientListChrome } from '@/hooks';

export const SampleCollectionQueue: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const collectSampleMutation = useCollectSample();
  const breakpoint = useBreakpoint();
  const isMobile = isBreakpointAtMost(breakpoint, 'sm');

  const { tests: catalogTests } = useTestCatalog();
  const bar = useLabQueueBarFilters('collection');
  const {
    items: worklistItems,
    pagination,
    isLoading,
    isError,
    error: worklistError,
    refetch,
    goToPage,
  } = useCollectionWorklist(bar.serverFilters);
  const worklistChrome = useClientListChrome({
    loadFailedKey: 'lab.worklist.loadFailed',
    isLoading,
    isError,
    error: worklistError,
    refetch,
  });
  const collectionDisplays = useMemo(
    () => worklistItems.map(worklistItemToQueueRow),
    [worklistItems],
  );

  const {
    filteredItems: filteredDisplaysRaw,
    isSampleLookup,
    isLookupBelowMin,
  } = useLabQueuePageFilters({
    items: collectionDisplays,
    workflowType: 'collection',
    bar,
  });
  const filterBarProps = useLabQueueFilterBarProps(bar);

  const filteredDisplays = filteredDisplaysRaw as CollectionQueueRow[];

  const { handleCollect } = useSubmitSampleCollection({
    isAuthenticated: !!currentUser,
    collectSampleMutation,
  });

  return (
    <ErrorBoundary>
      <LabWorkflowQueueLayout
        loading={worklistChrome.loading && collectionDisplays.length === 0}
        items={filteredDisplays}
        renderCard={display => (
          <SampleCollectionCard
            display={display}
            onCollect={handleCollect}
            isCollecting={collectSampleMutation.isPending}
            isMobile={isMobile}
            tests={catalogTests}
          />
        )}
        getItemKey={(display: CollectionQueueRow, idx: number) =>
          `${display.orderId}-${display.sample?.sampleType || 'unknown'}-${display.sample?.sampleId || idx}-${idx}`
        }
        emptyTitle={
          isSampleLookup ? EMPTY_COPY.matchingSamples.title : EMPTY_COPY.pendingCollections.title
        }
        emptyDescription={
          isSampleLookup
            ? EMPTY_COPY.matchingSamples.description
            : isLookupBelowMin
              ? emptySubtitle(
                  'samples',
                  `you enter at least ${LAB_CONFIG.SAMPLE_LOOKUP_MIN_CHARS} characters to search`,
                )
              : EMPTY_COPY.pendingCollections.description
        }
        filterRow={
          <LabQueueFilterRow pagination={pagination} onPageChange={goToPage}>
            <LabQueueFilters config={collectionFilterConfig} {...filterBarProps} />
          </LabQueueFilterRow>
        }
      />
    </ErrorBoundary>
  );
};
