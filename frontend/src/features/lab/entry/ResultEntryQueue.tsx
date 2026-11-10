/**
 * ResultEntryQueue - Main view for result entry workflow
 */

import React, { useCallback, useEffect, useMemo } from 'react';
import { uniqueSortedTestCodes, useTestsByCodes } from '@/features/catalog';
import {
  useLabQueueBarFilters,
  useLabQueueFilterBarProps,
  useLabQueuePageFilters,
} from '../hooks';
import { useEntryWorklist } from '../api/worklists';
import { worklistItemToEntryRow } from '../utils/labQueue';
import type { EntryQueueRow } from '../types/entryQueue';
import { LabWorkflowQueueLayout } from '../components/LabWorkflowQueueLayout';
import { LabQueueFilters } from '../components/LabQueueFilters';
import { LabQueueFilterRow } from '../components/LabQueueFilterRow';
import { entryFilterConfig } from '../constants';
import { EMPTY_COPY } from '@/components/display';
import { ErrorBoundary } from '@/components/feedback';
import { useBreakpoint, isBreakpointAtMost } from '@/hooks/useBreakpoint';
import { useResultEntryWorkflow } from './useResultEntryWorkflow';
import { useLabDraftStore } from '../state/labDraftStore';
import { ResultEntryQueueItem } from './ResultEntryQueueCards';
import { useClientListChrome } from '@/hooks';

/** Stable empty map so unedited cards keep the same `results` identity. */
const EMPTY_RESULT_VALUES: Record<string, string> = {};

export const ResultEntryQueue: React.FC = () => {
  const breakpoint = useBreakpoint();
  const isMobile = isBreakpointAtMost(breakpoint, 'sm');

  const bar = useLabQueueBarFilters('entry');
  const {
    items: worklistItems,
    pagination,
    isLoading: worklistLoading,
    isError: worklistError,
    error: worklistQueryError,
    refetch: refetchWorklist,
    goToPage,
  } = useEntryWorklist(bar.serverFilters);
  const worklistChrome = useClientListChrome({
    loadFailedKey: 'lab.worklist.loadFailed',
    isLoading: worklistLoading,
    isError: worklistError,
    error: worklistQueryError,
    refetch: refetchWorklist,
  });

  const entryRows = useMemo(() => worklistItems.map(worklistItemToEntryRow), [worklistItems]);
  const uniqueCodes = useMemo(
    () => uniqueSortedTestCodes(entryRows.map(row => row.testCode)),
    [entryRows],
  );
  const { byCode: fullByCode, isLoading: catalogLoading } = useTestsByCodes(uniqueCodes);

  const {
    entryDrafts,
    handleResultChange,
    handleNotesChange,
    areAllParametersFilled,
    handleSaveResults,
    openTestModal,
  } = useResultEntryWorkflow({ entryRows, fullByCode });

  useEffect(() => {
    const ids = entryRows.map(row => row.orderTestId);
    useLabDraftStore.getState().retainEntryDrafts(ids);
  }, [entryRows]);

  const { filteredItems: filteredRows } = useLabQueuePageFilters({
    items: entryRows,
    workflowType: 'entry',
    bar,
  });
  const filterBarProps = useLabQueueFilterBarProps(bar);

  const handleSaveRow = useCallback(
    (row: EntryQueueRow) => {
      void handleSaveResults(row.orderTestId, row.orderId, entryRows, fullByCode);
    },
    [handleSaveResults, entryRows, fullByCode],
  );

  const handleOpenRow = useCallback(
    (row: EntryQueueRow) => {
      openTestModal(row);
    },
    [openTestModal],
  );

  const hasNoItems = entryRows.length === 0;
  const catalogReadyForVisible =
    uniqueCodes.length === 0 ||
    (!catalogLoading &&
      filteredRows.every(row => fullByCode.get(row.testCode)?.parameters != null));
  const queueLoading =
    (worklistChrome.loading && hasNoItems) ||
    (filteredRows.length > 0 && !catalogReadyForVisible);

  return (
    <ErrorBoundary>
      <LabWorkflowQueueLayout
        loading={queueLoading}
        loadingPlaceholder="entry"
        items={filteredRows}
        renderCard={(row, idx) => {
          const entryRow = row as EntryQueueRow;
          const testDef = fullByCode.get(entryRow.testCode);
          const isComplete = testDef?.parameters
            ? areAllParametersFilled(entryRow.orderTestId, testDef.parameters.length)
            : false;
          const draft = entryDrafts[entryRow.orderTestId];
          return (
            <ResultEntryQueueItem
              row={entryRow}
              idx={idx}
              testDef={testDef}
              results={draft?.results ?? EMPTY_RESULT_VALUES}
              technicianNotes={draft?.technicianNotes ?? ''}
              isComplete={isComplete}
              isMobile={isMobile}
              onResultsChange={(_key, paramCode, value) =>
                handleResultChange(entryRow.orderTestId, paramCode, value)
              }
              onNotesChange={(_key, notes) => handleNotesChange(entryRow.orderTestId, notes)}
              onSaveRow={handleSaveRow}
              onOpenRow={handleOpenRow}
            />
          );
        }}
        getItemKey={(row, idx) => `entry-${(row as EntryQueueRow).orderTestId}-${idx}`}
        emptyTitle={EMPTY_COPY.pendingResults.title}
        emptyDescription={EMPTY_COPY.pendingResults.description}
        filterRow={
          <LabQueueFilterRow pagination={pagination} onPageChange={goToPage}>
            <LabQueueFilters config={entryFilterConfig} {...filterBarProps} />
          </LabQueueFilterRow>
        }
      />
    </ErrorBoundary>
  );
};
