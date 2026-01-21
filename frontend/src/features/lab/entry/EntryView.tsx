/**
 * EntryView - Main view for result entry workflow
 * 
 * Displays tests awaiting result entry (status: sample-collected or in-progress).
 */

import React, { useContext, useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useOrders } from '@/features/order/OrderContext';
import { TestsContext } from '@/features/test/TestsContext';
import { useSamples } from '@/features/lab/SamplesContext';
import { usePatients } from '@/hooks';
import { checkReferenceRangeWithDemographics } from '@/utils';
import { getPatientName, getTestName, getTestSampleType } from '@/utils/typeHelpers';
import toast from 'react-hot-toast';
import { logger } from '@/utils/logger';
import type { TestResult, TestWithContext } from '@/types';
import { isCollectedSample } from '@/types';
import { EntryCard } from './EntryCard';
import { LabWorkflowView, createLabItemFilter } from '../components/LabWorkflowView';
import { useModal, ModalType } from '@/shared/contexts/ModalContext';
import { resultAPI } from '@/services/api';

export const EntryView: React.FC = () => {
  const ordersContext = useOrders();
  const testsContext = useContext(TestsContext);
  const patientsContext = usePatients();
  const samplesContext = useSamples();
  const { openModal } = useModal();
  const [results, setResults] = useState<Record<string, Record<string, string>>>({});
  const [technicianNotes, setTechnicianNotes] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});

  // Build list of tests awaiting result entry
  // Excludes superseded tests (those replaced by retests)
  const allTests: TestWithContext[] = useMemo(() => {
    if (!ordersContext || !testsContext || !patientsContext || !samplesContext) return [];

    return ordersContext.orders.flatMap(order => {
      const patient = patientsContext.getPatient(order.patientId);
      const patientName = getPatientName(order.patientId, patientsContext.patients);

      return order.tests
        .filter(test =>
          // Filter for tests awaiting result entry (sample-collected or in-progress)
          // Superseded tests are already excluded by status check
          test.status === 'sample-collected' || test.status === 'in-progress'
        )
        .map(test => {
          const testName = getTestName(test.testCode, testsContext.tests);
          const sampleType = getTestSampleType(test.testCode, testsContext.tests);
          const sample = test.sampleId ? samplesContext.getSample(test.sampleId) : undefined;

          let collectedAt: string | undefined;
          let collectedBy: string | undefined;
          if (sample && isCollectedSample(sample)) {
            collectedAt = sample.collectedAt;
            collectedBy = sample.collectedBy;
          }

          return {
            ...test,
            orderId: order.orderId,
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
  }, [ordersContext, testsContext, patientsContext, samplesContext]);

  const filterTest = useMemo(() => createLabItemFilter<TestWithContext>(), []);

  const handleResultChange = useCallback((resultKey: string, paramCode: string, value: string) => {
    setResults(prev => ({
      ...prev,
      [resultKey]: { ...(prev[resultKey] || {}), [paramCode]: value ?? '' },
    }));
  }, []);

  const handleNotesChange = useCallback((resultKey: string, notes: string) => {
    setTechnicianNotes(prev => ({ ...prev, [resultKey]: notes ?? '' }));
  }, []);

  const areAllParametersFilled = useCallback((resultKey: string, parameterCount: number): boolean => {
    const testResults = results[resultKey];
    if (!testResults) return false;
    return Object.values(testResults).filter(v => v?.trim()).length === parameterCount;
  }, [results]);

  const handleSaveResults = useCallback(async (
    orderId: string,
    testCode: string,
    finalResults?: Record<string, string>,
    finalNotes?: string
  ) => {
    if (!testsContext || !ordersContext) return;

    const resultKey = `${orderId}-${testCode}`;

    // Prevent concurrent submissions
    if (isSaving[resultKey]) {
      return;
    }

    const testResults = finalResults || results[resultKey];
    if (!testResults || Object.keys(testResults).length === 0) {
      toast.error('No results to save');
      return;
    }

    const testDef = testsContext.getTest(testCode);
    if (!testDef?.parameters) {
      toast.error('Test parameters not found');
      return;
    }

    const formattedResults: Record<string, TestResult> = {};
    const testItem = allTests.find(t => t.orderId === orderId && t.testCode === testCode);
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
          if (param.criticalLow !== undefined && numValue < param.criticalLow) status = 'critical';
          else if (param.criticalHigh !== undefined && numValue > param.criticalHigh) status = 'critical';
        }
      } else if ((param.valueType === 'SELECT' || param.type === 'select') && param.allowedValues) {
        if (!param.allowedValues.includes(value)) {
          toast.error(`${param.name}: Invalid value. Must be one of: ${param.allowedValues.join(', ')}`);
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
      await resultAPI.enterResults(orderId, testCode, {
        results: formattedResults,
        technicianNotes: finalNotes || technicianNotes[resultKey] || undefined,
      });
      await ordersContext.refreshOrders();
      toast.success('Results saved successfully');

      // Clear local state
      setResults(prev => { const n = { ...prev }; delete n[resultKey]; return n; });
      setTechnicianNotes(prev => { const n = { ...prev }; delete n[resultKey]; return n; });
    } catch (error) {
      logger.error('Error saving results', error instanceof Error ? error : undefined);
      toast.error('Failed to save results. Please try again.');
    } finally {
      setIsSaving(prev => ({ ...prev, [resultKey]: false }));
    }
  }, [results, technicianNotes, allTests, testsContext, ordersContext, isSaving]);

  // Use a ref to store the openTestModal function to avoid circular dependency
  const openTestModalRef = useRef<(test: TestWithContext, filteredTests: TestWithContext[]) => void>(undefined);

  const openTestModal = useCallback((test: TestWithContext, filteredTests: TestWithContext[]) => {
    if (!testsContext) return;

    const testDef = testsContext.getTest(test.testCode);
    const resultKey = `${test.orderId}-${test.testCode}`;
    if (!testDef?.parameters) return;

    const isComplete = areAllParametersFilled(resultKey, testDef.parameters.length);
    const currentIndex = filteredTests.findIndex(
      t => t.orderId === test.orderId && t.testCode === test.testCode
    );

    // Use ref for recursive calls to avoid circular dependency warning
    const onNext = currentIndex < filteredTests.length - 1
      ? () => openTestModalRef.current?.(filteredTests[currentIndex + 1], filteredTests)
      : undefined;
    const onPrev = currentIndex > 0
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
  }, [testsContext, results, technicianNotes, areAllParametersFilled, handleResultChange, handleNotesChange, handleSaveResults, openModal]);

  // Keep ref in sync with the callback
  useEffect(() => {
    openTestModalRef.current = openTestModal;
  }, [openTestModal]);

  if (!ordersContext || !testsContext || !patientsContext || !samplesContext) {
    return <div>Loading...</div>;
  }

  return (
    <LabWorkflowView
      title="Result Entry"
      items={allTests}
      filterFn={filterTest}
      renderCard={(test, idx, filteredTests) => {
        const testDef = testsContext.getTest(test.testCode);
        const resultKey = `${test.orderId}-${test.testCode}`;
        const isComplete = testDef?.parameters
          ? areAllParametersFilled(resultKey, testDef.parameters.length)
          : false;

        return (
          <EntryCard
            key={`${test.orderId}-${test.testCode}-${idx}`}
            test={test}
            testDef={testDef}
            resultKey={resultKey}
            results={results[resultKey] || {}}
            technicianNotes={technicianNotes[resultKey] || ''}
            isComplete={isComplete}
            onResultsChange={handleResultChange}
            onNotesChange={handleNotesChange}
            onSave={(finalResults?: Record<string, string>, finalNotes?: string) =>
              handleSaveResults(test.orderId, test.testCode, finalResults, finalNotes)
            }
            onClick={() => openTestModal(test, filteredTests as TestWithContext[])}
          />
        );
      }}
      getItemKey={(test, idx) => `${test.orderId}-${test.testCode}-${idx}`}
      emptyIcon="checklist"
      emptyTitle="No Pending Results"
      emptyDescription="There are no samples waiting for result entry."
      searchPlaceholder="Search tests..."
    />
  );
};
