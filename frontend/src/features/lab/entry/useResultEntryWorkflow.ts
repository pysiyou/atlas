/**
 * useResultEntryWorkflow
 *
 * Queue-side selectors over the lab draft store plus save/open helpers.
 */

import { useCallback } from 'react';
import { useEnterResults } from '../api/results';
import { notify } from '@/utils/feedback';
import { logger } from '@/utils/logger';
import { toRawResultPayload, findTestById } from './resultEntry';
import { isLabActionAllowed } from '../utils/queueDisplay';
import { useResultEntryDetailModal } from './useResultEntryDetailModal';
import { useLabDraftStore } from '../state/labDraftStore';
import type { TestWithContext, Test } from '@/types';

export interface UseEntryWorkflowOptions {
  allTests: TestWithContext[];
  /** Full catalog documents keyed by code — summaries do not include parameters. */
  fullByCode: Map<string, Test>;
}

export interface EntryWorkflow {
  entryDrafts: Record<number, { results: Record<string, string>; technicianNotes: string }>;
  enterMutation: ReturnType<typeof useEnterResults>;
  handleResultChange: (orderTestId: number, paramCode: string, value: string) => void;
  handleNotesChange: (orderTestId: number, notes: string) => void;
  areAllParametersFilled: (orderTestId: number, parameterCount: number) => boolean;
  handleSaveResults: (
    orderTestId: number,
    orderId: number | string,
    allTests: TestWithContext[],
    fullByCode: Map<string, Test>,
    finalResults?: Record<string, string>,
    finalNotes?: string
  ) => Promise<void>;
  openTestModal: (test: TestWithContext) => void;
}

export function useResultEntryWorkflow({
  allTests,
  fullByCode,
}: UseEntryWorkflowOptions): EntryWorkflow {
  const entryDrafts = useLabDraftStore(s => s.entry);
  const setEntryResultParam = useLabDraftStore(s => s.setEntryResultParam);
  const setEntryNotes = useLabDraftStore(s => s.setEntryNotes);
  const clearEntryDraft = useLabDraftStore(s => s.clearEntryDraft);
  const enterMutation = useEnterResults();

  const handleResultChange = useCallback(
    (orderTestId: number, paramCode: string, value: string) => {
      setEntryResultParam(orderTestId, paramCode, value);
    },
    [setEntryResultParam]
  );

  const handleNotesChange = useCallback(
    (orderTestId: number, notes: string) => {
      setEntryNotes(orderTestId, notes);
    },
    [setEntryNotes]
  );

  const areAllParametersFilled = useCallback(
    (orderTestId: number, parameterCount: number): boolean => {
      const testResults = entryDrafts[orderTestId]?.results;
      if (!testResults) return false;
      return Object.values(testResults).filter(v => v?.trim()).length === parameterCount;
    },
    [entryDrafts]
  );

  const handleSaveResults = useCallback(
    async (
      orderTestId: number,
      orderId: number | string,
      saveAllTests: TestWithContext[] = allTests,
      saveFullByCode: Map<string, Test> = fullByCode,
      finalResults?: Record<string, string>,
      finalNotes?: string
    ) => {
      const orderIdStr = typeof orderId === 'string' ? orderId : orderId.toString();

      if (enterMutation.isPending) return;

      const testResults = finalResults || entryDrafts[orderTestId]?.results;
      if (!testResults || Object.keys(testResults).length === 0) {
        notify.toast('lab.entry.noResults');
        return;
      }

      const testItem = findTestById(saveAllTests, orderTestId);
      if (!testItem) {
        notify.toast('lab.entry.testNotFound');
        return;
      }

      if (!isLabActionAllowed(testItem.allowedActions, 'enterResults')) {
        return;
      }

      const testDef = saveFullByCode.get(testItem.testCode);
      if (!testDef?.parameters) {
        notify.toast('lab.entry.parametersMissing');
        return;
      }

      const rawResults = toRawResultPayload(testResults, testDef);
      if (!rawResults) return;

      try {
        await enterMutation.mutateAsync({
          orderId: orderIdStr,
          orderTestId,
          results: rawResults,
          technicianNotes: finalNotes || entryDrafts[orderTestId]?.technicianNotes || undefined,
        });
        notify.toast('lab.entry.save.success');
        clearEntryDraft(orderTestId);
      } catch (error) {
        logger.error('Error saving results', error instanceof Error ? error : undefined);
        notify.apiError('lab.entry.save.error', error);
        throw error;
      }
    },
    [allTests, fullByCode, entryDrafts, enterMutation, clearEntryDraft]
  );

  const openTestModal = useResultEntryDetailModal();

  return {
    entryDrafts,
    enterMutation,
    handleResultChange,
    handleNotesChange,
    areAllParametersFilled,
    handleSaveResults,
    openTestModal,
  };
}
