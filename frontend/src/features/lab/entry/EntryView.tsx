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
  useSampleLookup,
  usePatientNameLookup,
} from '@/hooks/queries';
import { checkReferenceRangeWithDemographics } from '@/utils';
import { getTestSampleType } from '@/utils/typeHelpers';
import toast from 'react-hot-toast';
import { logger } from '@/utils/logger';
import type { TestResult, TestStatus, TestWithContext } from '@/types';
import { isCollectedSample } from '@/types';
import { EntryCard } from './EntryCard';
import { EntryFilters } from '../components/filters';
import { LabWorkflowView, createLabItemFilter } from '../components/LabWorkflowView';
import { DataErrorBoundary } from '@/shared/components';
import { useModal, ModalType } from '@/shared/context/ModalContext';
import { useBreakpoint, isBreakpointAtMost } from '@/hooks/useBreakpoint';
import { resultAPI } from '@/services/api';

// Large component is necessary for comprehensive entry view with filtering, sorting, card rendering, and result entry functionality
// eslint-disable-next-line max-lines-per-function
export const EntryView: React.FC = () => {
  const { orders, refetch: refreshOrders } = useOrdersList();
  const { invalidateAll: invalidateOrders } = useInvalidateOrders();
  const { tests: testCatalog } = useTestCatalog();
  const { getTest } = useTestNameLookup();
  const { getSample } = useSampleLookup();
  const { getPatient, getPatientName } = usePatientNameLookup();
  const { openModal } = useModal();
  const breakpoint = useBreakpoint();
  const isMobile = isBreakpointAtMost(breakpoint, 'sm');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);
  const [sampleTypeFilters, setSampleTypeFilters] = useState<string[]>([]);
  const [statusFilters, setStatusFilters] = useState<TestStatus[]>([]);
  const [results, setResults] = useState<Record<string, Record<string, string>>>({});
  const [technicianNotes, setTechnicianNotes] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});

  // Build list of tests awaiting result entry
  // Excludes superseded tests (those replaced by retests)
  const allTests: TestWithContext[] = useMemo(() => {
    if (!orders || !testCatalog) return [];

    return orders.flatMap(order => {
      const patient = getPatient(order.patientId);
      const patientName = getPatientName(order.patientId);

      return order.tests
        .filter(
          test =>
            // Filter for tests awaiting result entry (sample-collected or in-progress)
            // Superseded tests are already excluded by status check
            test.status === 'sample-collected' || test.status === 'in-progress'
        )
        .map(test => {
          const testName = getTest(test.testCode)?.name || test.testCode;
          const sampleType = getTestSampleType(test.testCode, testCatalog);
          const sample = test.sampleId ? getSample(test.sampleId) : undefined;

          let collectedAt: string | undefined;
          let collectedBy: string | undefined;
          if (sample && isCollectedSample(sample)) {
            collectedAt = sample.collectedAt;
            collectedBy = sample.collectedBy;
          }

          return {
            ...test,
            orderId: order.orderId,
            orderDate: order.orderDate,
            patientId: order.patientId,
            patientName,
            testName,
            sampleType,
            patient,
            priority: order.priority,
            referringPhysician: order.referringPhysician,
            collectedAt,
            collectedBy,
            resultEnteredAt: test.resultEnteredAt ?? undefined,
            resultValidatedAt: test.resultValidatedAt ?? undefined,
            results: test.results ?? undefined,
            // Include retest tracking info
            isRetest: test.isRetest,
            retestOfTestId: test.retestOfTestId,
            retestNumber: test.retestNumber,
            resultRejectionHistory: test.resultRejectionHistory,
            // Include sample recollection info
            sampleIsRecollection: sample?.isRecollection,
            sampleOriginalSampleId: sample?.originalSampleId,
            sampleRecollectionReason: sample?.recollectionReason,
            sampleRecollectionAttempt: sample?.recollectionAttempt,
            sampleRejectionHistory: sample?.rejectionHistory,
          };
        });
    });
  }, [orders, testCatalog, getPatient, getPatientName, getSample, getTest]);

  const filterTest = useMemo(() => createLabItemFilter<TestWithContext>(), []);

  const filteredTests = useMemo(() => {
    let out = allTests;

    if (dateRange) {
      const [start, end] = dateRange;
      const startDate = new Date(start);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);
      out = out.filter(t => {
        const d = (t as { orderDate?: string }).orderDate;
        if (!d) return false;
        const orderDate = new Date(d);
        return orderDate >= startDate && orderDate <= endDate;
      });
    }

    if (sampleTypeFilters.length > 0) {
      out = out.filter(
        t => t.sampleType && sampleTypeFilters.includes(t.sampleType)
      );
    }

    if (statusFilters.length > 0) {
      out = out.filter(
        t => t.status && statusFilters.includes(t.status as TestStatus)
      );
    }

    if (searchQuery.trim()) {
      out = out.filter(t => filterTest(t, searchQuery));
    }

    return out;
  }, [allTests, dateRange, sampleTypeFilters, statusFilters, searchQuery, filterTest]);

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
        toast.error('No results to save');
        return;
      }

      const testDef = getTest(testCode);
      if (!testDef?.parameters) {
        toast.error('Test parameters not found');
        return;
      }

      const numericOrderId = typeof orderId === 'string' ? parseInt(orderId, 10) : orderId;
      const formattedResults: Record<string, TestResult> = {};
      const testItem = allTests.find(t => t.orderId === numericOrderId && t.testCode === testCode);
      if (!testItem) {
        toast.error('Test not found in current list');
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
            toast.error(
              `${param.name}: Invalid value. Must be one of: ${param.allowedValues.join(', ')}`
            );
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
        await refreshOrders();
        toast.success('Results saved successfully');

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
        toast.error('Failed to save results. Please try again.');
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
      refreshOrders,
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
          <EntryFilters
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
