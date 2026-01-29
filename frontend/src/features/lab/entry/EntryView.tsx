/**
 * EntryView - Main view for result entry workflow
 *
 * Displays tests awaiting result entry (status: sample-collected or in-progress).
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  useOrdersList,
  useInvalidateOrders,
  useTestCatalog,
  useTestNameLookup,
} from '@/hooks/queries';
import { checkReferenceRangeWithDemographics } from '@/utils';
import toast from 'react-hot-toast';
import { logger } from '@/utils/logger';
import type { TestResult, TestStatus, TestWithContext } from '@/types';
import { EntryCard } from './EntryCard';
import { LabWorkflowView, createLabItemFilter } from '../components/LabWorkflowView';
import { LabFilters } from '../components/LabFilters';
import { useLabWorkflowFilters, useLabTestsFromOrders } from '../hooks';
import { entryFilterConfig } from '../constants';
import { DataErrorBoundary } from '@/shared/components';
import { useModal, ModalType } from '@/shared/context/ModalContext';
import { useBreakpoint, isBreakpointAtMost } from '@/hooks/useBreakpoint';
import { resultAPI } from '@/services/api';

// Large component is necessary for comprehensive entry view with filtering, sorting, card rendering, and result entry functionality
// eslint-disable-next-line max-lines-per-function
export const EntryView: React.FC = () => {
  const { orders } = useOrdersList();
  const { invalidateAll: invalidateOrders } = useInvalidateOrders();
  const { tests: testCatalog } = useTestCatalog();
  const { getTest } = useTestNameLookup();
  const { openModal } = useModal();
  const breakpoint = useBreakpoint();
  const isMobile = isBreakpointAtMost(breakpoint, 'sm');
  const [results, setResults] = useState<Record<string, Record<string, string>>>({});
  const [technicianNotes, setTechnicianNotes] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});

  const allTests = useLabTestsFromOrders({
    orders,
    testCatalog,
    statusFilter: ['sample-collected', 'in-progress'],
    includePatient: true,
  });

  const filterTest = useMemo(() => createLabItemFilter<TestWithContext>(), []);

  const getOrderDate = useCallback((t: TestWithContext & { orderDate?: string }) => t.orderDate, []);
  const getSampleType = useCallback((t: TestWithContext) => t.sampleType, []);
  const getStatus = useCallback((t: TestWithContext) => t.status as TestStatus, []);

  const {
    filteredItems: filteredTests,
    searchQuery,
    setSearchQuery,
    dateRange,
    setDateRange,
    sampleTypeFilters,
    setSampleTypeFilters,
    statusFilters,
    setStatusFilters,
  } = useLabWorkflowFilters<TestWithContext, TestStatus>({
    items: allTests,
    getOrderDate,
    getSampleType,
    getStatus,
    searchFilterFn: filterTest,
  });

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
      finalResults?: Record<string, string>,
      finalNotes?: string
    ) => {
      if (!testCatalog || !orders) return;

      const orderIdStr = typeof orderId === 'string' ? orderId : orderId.toString();
      const resultKey = `${orderIdStr}-${testCode}`;

      // Prevent concurrent submissions
      if (isSaving[resultKey]) {
        return;
      }

      const testResults = finalResults || results[resultKey];
      if (!testResults || Object.keys(testResults).length === 0) {
        toast.error({
          title: 'No results to save',
          subtitle: 'There are no results entered for this test. Enter values in the required fields before saving.',
        });
        return;
      }

      const testDef = getTest(testCode);
      if (!testDef?.parameters) {
        toast.error({
          title: 'Test parameters not found',
          subtitle: 'The test configuration could not be loaded. Refresh the page or contact support.',
        });
        return;
      }

      const numericOrderId = typeof orderId === 'string' ? parseInt(orderId, 10) : orderId;
      const formattedResults: Record<string, TestResult> = {};
      const testItem = allTests.find(t => t.orderId === numericOrderId && t.testCode === testCode);
      if (!testItem) {
        toast.error({
          title: 'Test not found in current list',
          subtitle: 'This test could not be found in the current order. The list may have been updated—refresh and try again.',
        });
        return;
      }
      const patient = testItem.patient;

      testDef.parameters.forEach(param => {
        const value = testResults[param.code];
        if (!value) return;

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
              subtitle: 'The value entered is not in the allowed list for this parameter. Choose one of the options shown.',
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
      });

      setIsSaving(prev => ({ ...prev, [resultKey]: true }));

      try {
        const orderIdStr = typeof orderId === 'string' ? orderId : orderId.toString();
        await resultAPI.enterResults(orderIdStr, testCode, {
          results: formattedResults,
          technicianNotes: finalNotes || technicianNotes[resultKey] || undefined,
        });
        await invalidateOrders();
        toast.success({
          title: 'Results saved successfully',
          subtitle: 'The results have been saved and the order has been updated. You can continue with other tests.',
        });

        // Clear local state
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
      } catch (error) {
        logger.error('Error saving results', error instanceof Error ? error : undefined);
        toast.error({
          title: 'Failed to save results. Please try again.',
          subtitle: 'The results could not be saved. Check your connection and try again.',
        });
      } finally {
        setIsSaving(prev => ({ ...prev, [resultKey]: false }));
      }
    },
    [
      results,
      technicianNotes,
      allTests,
      testCatalog,
      orders,
      isSaving,
      getTest,
      invalidateOrders,
    ]
  );

  // Use a ref to store the openTestModal function to avoid circular dependency
  const openTestModalRef =
    useRef<(test: TestWithContext, filteredTests: TestWithContext[]) => void>(undefined);

  const openTestModal = useCallback(
    (test: TestWithContext, filteredTests: TestWithContext[]) => {
      if (!testCatalog) return;

      const testDef = getTest(test.testCode);
      const resultKey = `${test.orderId}-${test.testCode}`;
      if (!testDef?.parameters) return;

      const isComplete = areAllParametersFilled(resultKey, testDef.parameters.length);
      const currentIndex = filteredTests.findIndex(
        t => t.orderId === test.orderId && t.testCode === test.testCode
      );

      // Use ref for recursive calls to avoid circular dependency warning
      const onNext =
        currentIndex < filteredTests.length - 1
          ? () => openTestModalRef.current?.(filteredTests[currentIndex + 1], filteredTests)
          : undefined;
      const onPrev =
        currentIndex > 0
          ? () => openTestModalRef.current?.(filteredTests[currentIndex - 1], filteredTests)
          : undefined;

      openModal(ModalType.RESULT_DETAIL, {
        test,
        testDef,
        resultKey,
        results: results[resultKey] || {},
        technicianNotes: technicianNotes[resultKey] || '',
        isComplete,
        onResultsChange: handleResultChange,
        onNotesChange: handleNotesChange,
        onSave: (finalResults?: Record<string, string>, finalNotes?: string) =>
          handleSaveResults(test.orderId, test.testCode, finalResults, finalNotes),
        onNext,
        onPrev,
      });
    },
    [
      testCatalog,
      getTest,
      results,
      technicianNotes,
      areAllParametersFilled,
      handleResultChange,
      handleNotesChange,
      handleSaveResults,
      openModal,
    ]
  );

  // Keep ref in sync with the callback
  useEffect(() => {
    openTestModalRef.current = openTestModal;
  }, [openTestModal]);

  if (!orders || !testCatalog) {
    return <div>Loading...</div>;
  }

  return (
    <DataErrorBoundary>
      <LabWorkflowView
        items={filteredTests}
        renderCard={(test, idx, filtered) => {
          const testDef = getTest(test.testCode);
          const resultKey = `${test.orderId}-${test.testCode}`;
          const isComplete = testDef?.parameters
            ? areAllParametersFilled(resultKey, testDef.parameters.length)
            : false;

          const cardProps = {
            test,
            testDef,
            resultKey,
            results: results[resultKey] || {},
            technicianNotes: technicianNotes[resultKey] || '',
            isComplete,
            onResultsChange: handleResultChange,
            onNotesChange: handleNotesChange,
            onSave: () => handleSaveResults(test.orderId, test.testCode),
            onClick: () => openTestModal(test, filtered as TestWithContext[]),
          };

          return (
            <EntryCard
              key={`${test.orderId}-${test.testCode}-${idx}`}
              {...cardProps}
              isMobile={isMobile}
            />
          );
        }}
        getItemKey={(test, idx) => `${test.orderId}-${test.testCode}-${idx}`}
        emptyIcon="checklist"
        emptyTitle="No Pending Results"
        emptyDescription="There are no samples waiting for result entry."
        filterRow={
          <LabFilters<TestStatus[]>
            config={entryFilterConfig}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            sampleTypeFilters={sampleTypeFilters}
            onSampleTypeFiltersChange={setSampleTypeFilters}
            statusFilters={statusFilters}
            onStatusFiltersChange={setStatusFilters}
          />
        }
      />
    </DataErrorBoundary>
  );
};
