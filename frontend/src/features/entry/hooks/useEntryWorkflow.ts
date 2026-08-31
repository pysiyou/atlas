/**
 * useEntryWorkflow
 *
 * Encapsulates result entry state, result formatting, validation,
 * mutation logic, and modal opening for the result entry workflow.
 */

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTestNameLookup } from '@/features/catalog/api/useTestCatalog';
import { useEnterResults } from '@/features/validation/api/useResultMutations';
import { queryKeys } from '@/lib/query';
import { toast } from '@/app/AppToastBar';
import { logger } from '@/utils/logger';
import { formatParameterResults, findTestInList } from '../utils/entryWorkflowHelpers';
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
    orderId: number | string,
    testCode: string,
    allTests: TestWithContext[],
    testCatalog: Test[] | undefined,
    orders: Order[] | undefined,
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
      orderId: number | string,
      testCode: string,
      saveAllTests: TestWithContext[],
      saveTestCatalog: Test[] | undefined,
      _saveOrders: Order[] | undefined,
      finalResults?: Record<string, string>,
      finalNotes?: string
    ) => {
      if (!saveTestCatalog) return;

      const orderIdStr = typeof orderId === 'string' ? orderId : orderId.toString();
      const resultKey = `${orderIdStr}-${testCode}`;

      if (enterMutation.isPending) return;

      const testResults = finalResults || results[resultKey];
      if (!testResults || Object.keys(testResults).length === 0) {
        toast.error({
          title: 'No results to save',
          subtitle:
            'There are no results entered for this test. Enter values in the required fields before saving.',
        });
        return;
      }

      const testDef = getTest(testCode);
      if (!testDef?.parameters) {
        toast.error({
          title: 'Test parameters not found',
          subtitle:
            'The test configuration could not be loaded. Refresh the page or contact support.',
        });
        return;
      }

      const testItem = findTestInList(saveAllTests, orderId, testCode);
      if (!testItem) {
        toast.error({
          title: 'Test not found in current list',
          subtitle:
            'This test could not be found in the current order. The list may have been updated—refresh and try again.',
        });
        return;
      }

      const formattedResults = formatParameterResults(testResults, testDef, testItem);
      if (!formattedResults) return;

      try {
        await enterMutation.mutateAsync({
          orderId: orderIdStr,
          testCode,
          results: formattedResults,
          technicianNotes: finalNotes || technicianNotes[resultKey] || undefined,
        });
        toast.success({
          title: 'Results saved successfully',
          subtitle:
            'The results have been saved and the order has been updated. You can continue with other tests.',
        });
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
        toast.error({
          title: 'Failed to save results. Please try again.',
          subtitle: 'The results could not be saved. Check your connection and try again.',
        });
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
