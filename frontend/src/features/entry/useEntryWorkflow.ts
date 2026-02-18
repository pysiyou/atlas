/**
 * useEntryWorkflow
 *
 * Encapsulates result entry state, result formatting, validation,
 * and mutation logic for the result entry workflow.
 *
 * Extracted from EntryView.tsx to separate data/action logic from rendering.
 *
 * Note: openTestModal is intentionally kept in EntryView because it needs
 * a closure over allTests/testCatalog/orders which are fetched in the view.
 */

/* eslint-disable complexity */

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTestNameLookup } from '@/features/catalog/api/useTestCatalog';
import { useEnterResults } from '@/features/validation/api/useResultMutations';
import { queryKeys } from '@/lib/query';
import { checkReferenceRangeWithDemographics } from '@/features/lab/utils';
import { toast } from '@/components/feedback';
import { logger } from '@/utils/logger';
import type { TestResult, TestWithContext, Test, Order } from '@/types';

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
}

export function useEntryWorkflow(): EntryWorkflow {
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
      allTests: TestWithContext[],
      testCatalog: Test[] | undefined,
      orders: Order[] | undefined,
      finalResults?: Record<string, string>,
      finalNotes?: string
    ) => {
      if (!testCatalog || !orders) return;

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

      const numericOrderId = typeof orderId === 'string' ? parseInt(orderId, 10) : orderId;
      const formattedResults: Record<string, unknown> = {};
      const testItem = allTests.find(t => t.orderId === numericOrderId && t.testCode === testCode);
      if (!testItem) {
        toast.error({
          title: 'Test not found in current list',
          subtitle:
            'This test could not be found in the current order. The list may have been updated—refresh and try again.',
        });
        return;
      }
      const patient = testItem.patient;

      for (const param of testDef.parameters) {
        const value = testResults[param.code];
        if (!value) continue;

        let status: TestResult['status'] = 'normal';
        let processedValue: string | number = value;

        if (param.valueType === 'NUMERIC' || param.type === 'numeric') {
          const numValue = parseFloat(value);
          if (!isNaN(numValue)) {
            processedValue = numValue;
            status = checkReferenceRangeWithDemographics(numValue, param, patient);
            if (param.criticalLow !== undefined && numValue < param.criticalLow)
              status = 'critical';
            else if (param.criticalHigh !== undefined && numValue > param.criticalHigh)
              status = 'critical';
          }
        } else if (
          (param.valueType === 'SELECT' || param.type === 'select') &&
          param.allowedValues
        ) {
          if (!param.allowedValues.includes(value)) {
            toast.error({
              title: `${param.name}: Invalid value. Must be one of: ${param.allowedValues.join(', ')}`,
              subtitle:
                'The value entered is not in the allowed list for this parameter. Choose one of the options shown.',
            });
            return;
          }
        }

        formattedResults[param.code] = {
          value: processedValue,
          unit: param.unit,
          referenceRange: param.referenceRange,
          status,
        };
      }

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

  return {
    results,
    technicianNotes,
    enterMutation,
    handleResultChange,
    handleNotesChange,
    areAllParametersFilled,
    handleSaveResults,
  };
}
