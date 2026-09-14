/**
 * useEntryWorkflow
 *
 * Encapsulates result entry state, result formatting, validation,
 * mutation logic, and modal opening for the result entry workflow.
 */

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTestNameLookup } from '@/features/catalog';
import { useEnterResults } from '../api/results.api';
import { queryKeys } from '@/lib/query';
import { notify } from '@/utils/feedback';
import { logger } from '@/utils/logger';
import { formatParameterResults, findTestById } from './entryWorkflow.helpers';
import { orderTestKey } from '@/features/lab/utils/orderTestKey';
import { useEntryTestModal } from './useEntryTestModal';
import type { TestWithContext, Test, Order } from '@/types';

export interface UseEntryWorkflowOptions {
  allTests: TestWithContext[];
  testCatalog: Test[] | undefined;
  orders: Order[] | undefined;
}

export interface EntryWorkflow {
  results: Record<string, Record<string, string>>;
  technicianNotes: Record<string, string>;
  enterMutation: ReturnType<typeof useEnterResults>;
  handleResultChange: (resultKey: string, paramCode: string, value: string) => void;
  handleNotesChange: (resultKey: string, notes: string) => void;
  areAllParametersFilled: (resultKey: string, parameterCount: number) => boolean;
  handleSaveResults: (
    orderTestId: number,
    orderId: number | string,
    allTests: TestWithContext[],
    testCatalog: Test[] | undefined,
    finalResults?: Record<string, string>,
    finalNotes?: string
  ) => Promise<void>;
  openTestModal: (test: TestWithContext, filteredTests: TestWithContext[]) => void;
}

export function useEntryWorkflow({
  allTests,
  testCatalog,
  orders,
}: UseEntryWorkflowOptions): EntryWorkflow {
  const queryClient = useQueryClient();
  const { getTest } = useTestNameLookup();
  const [results, setResults] = useState<Record<string, Record<string, string>>>({});
  const [technicianNotes, setTechnicianNotes] = useState<Record<string, string>>({});
  const enterMutation = useEnterResults();

  const handleResultChange = useCallback((resultKey: string, paramCode: string, value: string) => {
    setResults(prev => ({
      ...prev,
      [resultKey]: { ...(prev[resultKey] || {}), [paramCode]: value ?? '' },
    }));
  }, []);

  const handleNotesChange = useCallback((resultKey: string, notes: string) => {
    setTechnicianNotes(prev => ({ ...prev, [resultKey]: notes ?? '' }));
  }, []);

  const areAllParametersFilled = useCallback(
    (resultKey: string, parameterCount: number): boolean => {
      const testResults = results[resultKey];
      if (!testResults) return false;
      return Object.values(testResults).filter(v => v?.trim()).length === parameterCount;
    },
    [results]
  );

  const handleSaveResults = useCallback(
    async (
      orderTestId: number,
      orderId: number | string,
      saveAllTests: TestWithContext[],
      saveTestCatalog: Test[] | undefined,
      finalResults?: Record<string, string>,
      finalNotes?: string
    ) => {
      if (!saveTestCatalog) return;

      const orderIdStr = typeof orderId === 'string' ? orderId : orderId.toString();
      const resultKey = orderTestKey(orderTestId);

      if (enterMutation.isPending) return;

      const testResults = finalResults || results[resultKey];
      if (!testResults || Object.keys(testResults).length === 0) {
        notify.toast('lab.entry.noResults');
        return;
      }

      const testItem = findTestById(saveAllTests, orderTestId);
      if (!testItem) {
        notify.toast('lab.entry.testNotFound');
        return;
      }

      const testDef = getTest(testItem.testCode);
      if (!testDef?.parameters) {
        notify.toast('lab.entry.parametersMissing');
        return;
      }

      const formattedResults = formatParameterResults(testResults, testDef, testItem);
      if (!formattedResults) return;

      try {
        await enterMutation.mutateAsync({
          orderId: orderIdStr,
          orderTestId,
          results: formattedResults,
          technicianNotes: finalNotes || technicianNotes[resultKey] || undefined,
        });
        notify.toast('lab.entry.save.success');
        setResults(prev => {
          const n = { ...prev };
          delete n[resultKey];
          return n;
        });
        setTechnicianNotes(prev => {
          const n = { ...prev };
          delete n[resultKey];
          return n;
        });
        await queryClient.refetchQueries({ queryKey: queryKeys.orders.all });
      } catch (error) {
        logger.error('Error saving results', error instanceof Error ? error : undefined);
        notify.apiError('lab.entry.save.error', error);
        throw error;
      }
    },
    [results, technicianNotes, getTest, enterMutation, queryClient]
  );

  const openTestModal = useEntryTestModal({
    testCatalog,
    orders,
    allTests,
    results,
    technicianNotes,
    areAllParametersFilled,
    handleResultChange,
    handleNotesChange,
    handleSaveResults,
  });

  return {
    results,
    technicianNotes,
    enterMutation,
    handleResultChange,
    handleNotesChange,
    areAllParametersFilled,
    handleSaveResults,
    openTestModal,
  };
}
