/**
 * useResultEntryWorkflow
 *
 * Queue-side selectors over the lab draft store plus save/open helpers.
 */

import { useCallback } from 'react';
import { useEnterResults } from '../api/results';
import { notify } from '@/feedback';
import { logger } from '@/utils/logger';
import { toRawResultPayload } from './resultEntry';
import { isLabActionAllowed } from '../utils/queueDisplay';
import { useResultEntryDetailModal } from './useResultEntryDetailModal';
import { useLabDraftStore } from '../state/labDraftStore';
import type  { OrderableTest } from '@/types';
import { findEntryRowById, type EntryQueueRow } from '../types/queues';

export interface UseEntryWorkflowOptions {
  entryRows: EntryQueueRow[];
  /** Full catalog documents keyed by code — summaries do not include analytes. */
  fullByCode: Map<string, OrderableTest>;
}

export interface EntryWorkflow {
  entryDrafts: Record<number, { results: Record<string, string>; technicianNotes: string }>;
  enterMutation: ReturnType<typeof useEnterResults>;
  handleResultChange: (orderTestId: number, analyteCode: string, value: string) => void;
  handleNotesChange: (orderTestId: number, notes: string) => void;
  areAllAnalytesFilled: (orderTestId: number, analyteCount: number) => boolean;
  handleSaveResults: (
    orderTestId: number,
    orderId: string,
    rows?: EntryQueueRow[],
    fullByCode?: Map<string, OrderableTest>,
    finalResults?: Record<string, string>,
    finalNotes?: string
  ) => Promise<void>;
  openTestModal: (row: EntryQueueRow) => void;
}

export function useResultEntryWorkflow({
  entryRows,
  fullByCode,
}: UseEntryWorkflowOptions): EntryWorkflow {
  const entryDrafts = useLabDraftStore(s => s.entry);
  const setEntryAnalyteResult = useLabDraftStore(s => s.setEntryAnalyteResult);
  const setEntryNotes = useLabDraftStore(s => s.setEntryNotes);
  const clearEntryDraft = useLabDraftStore(s => s.clearEntryDraft);
  const enterMutation = useEnterResults();

  const handleResultChange = useCallback(
    (orderTestId: number, analyteCode: string, value: string) => {
      setEntryAnalyteResult(orderTestId, analyteCode, value);
    },
    [setEntryAnalyteResult]
  );

  const handleNotesChange = useCallback(
    (orderTestId: number, notes: string) => {
      setEntryNotes(orderTestId, notes);
    },
    [setEntryNotes]
  );

  const areAllAnalytesFilled = useCallback(
    (orderTestId: number, analyteCount: number): boolean => {
      const testResults = entryDrafts[orderTestId]?.results;
      if (!testResults) return false;
      return Object.values(testResults).filter(v => v?.trim()).length === analyteCount;
    },
    [entryDrafts]
  );

  const handleSaveResults = useCallback(
    async (
      orderTestId: number,
      orderId: string,
      saveRows: EntryQueueRow[] = entryRows,
      saveFullByCode: Map<string, OrderableTest> = fullByCode,
      finalResults?: Record<string, string>,
      finalNotes?: string
    ) => {
      if (enterMutation.isPending) return;

      const testResults = finalResults || entryDrafts[orderTestId]?.results;
      if (!testResults || Object.keys(testResults).length === 0) {
        notify.show('lab.entry.noResults');
        return;
      }

      const row = findEntryRowById(saveRows, orderTestId);
      if (!row) {
        notify.show('lab.entry.testNotFound');
        return;
      }

      if (!isLabActionAllowed(row.allowedActions, 'enterResults')) {
        return;
      }

      const testDef = saveFullByCode.get(row.testCode);
      if (!testDef?.analytes) {
        notify.show('lab.entry.resultComponentsMissing');
        return;
      }

      const rawResults = toRawResultPayload(testResults, testDef);
      if (!rawResults) return;

      try {
        await enterMutation.mutateAsync({
          orderId,
          orderTestId,
          results: rawResults,
          technicianNotes: finalNotes || entryDrafts[orderTestId]?.technicianNotes || undefined,
        });
        notify.show('lab.entry.save.success');
        clearEntryDraft(orderTestId);
      } catch (error) {
        logger.error('Error saving results', error instanceof Error ? error : undefined);
        notify.apiError('lab.entry.save.error', error);
        throw error;
      }
    },
    [entryRows, fullByCode, entryDrafts, enterMutation, clearEntryDraft]
  );

  const openTestModal = useResultEntryDetailModal();

  return {
    entryDrafts,
    enterMutation,
    handleResultChange,
    handleNotesChange,
    areAllAnalytesFilled,
    handleSaveResults,
    openTestModal,
  };
}
