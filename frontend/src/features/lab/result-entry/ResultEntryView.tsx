import React, { useContext, useState } from 'react';
import { useOrders } from '@/features/order/OrderContext';
import { TestsContext } from '@/features/test/TestsContext';

import { useSamples } from '@/features/lab/useSamples';
import { usePatients } from '@/hooks';
import { checkReferenceRangeWithDemographics } from '@/utils';
import { getPatientName, getTestName, getTestSampleType } from '@/utils/typeHelpers';
import { useAuth } from '@/hooks';
import toast from 'react-hot-toast';
import type { TestResult, TestWithContext } from '@/types';
import { isCollectedSample } from '@/types';
import { SearchBar } from '@/shared/ui';
import { EmptyState } from '../shared/EmptyState';
import { ResultEntryCard } from './ResultCard';
import { useTestFiltering } from '../useTestFiltering';
import { useModal, ModalType } from '@/shared/contexts/ModalContext';
/**
 * Filter function for test search
 */
const filterTest = (test: TestWithContext, query: string): boolean => {
  const lowerQuery = query.toLowerCase();
  return (
    test.orderId.toLowerCase().includes(lowerQuery) ||
    test.patientName.toLowerCase().includes(lowerQuery) ||
    test.testName.toLowerCase().includes(lowerQuery) ||
    (test.sampleId || '').toLowerCase().includes(lowerQuery) ||
    false
  );
};

/**
 * ResultEntry Component
 * 
 * Main list component for result entry. Displays all tests that need results entered
 * (status: 'collected' or 'in-progress'). Manages overall state for results and
 * technician notes, and handles saving results.
 * 
 * Similar structure to SampleCollection - list component that renders ResultEntryCard
 * components for each test.
 */
export const ResultEntry: React.FC = () => {
  const { currentUser } = useAuth();
  const ordersContext = useOrders();
  const testsContext = useContext(TestsContext);
  const patientsContext = usePatients();
  const samplesContext = useSamples();
  const { openModal } = useModal();
  const [results, setResults] = useState<Record<string, Record<string, string>>>({});
  const [technicianNotes, setTechnicianNotes] = useState<Record<string, string>>({});

  const allTests = ordersContext && testsContext && patientsContext && samplesContext
    ? ordersContext.orders.flatMap(order => {
        const patient = patientsContext.getPatient(order.patientId);
        const patientName = getPatientName(order.patientId, patientsContext.patients);
        
        return order.tests
          .filter(test => test.status === 'collected' || test.status === 'in-progress')
          .map(test => {
            // Get test name and sample type
            const testName = getTestName(test.testCode, testsContext.tests);
            const sampleType = getTestSampleType(test.testCode, testsContext.tests);
            
            // Get sample data if sampleId exists
            const sample = test.sampleId ? samplesContext.getSample(test.sampleId) : undefined;
            
            // Extract collection data using type guard
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
              patient: patient, // Include patient for demographic-specific ranges
              priority: order.priority,
              referringPhysician: order.referringPhysician,
              // Convert null to undefined for optional properties
              collectedAt,
              collectedBy,
              resultEnteredAt: test.resultEnteredAt ?? undefined,
              resultValidatedAt: test.resultValidatedAt ?? undefined,
              results: test.results ?? undefined,
            };
          });
      })
    : [];

  const { filteredItems: filteredTests, searchQuery, setSearchQuery, isEmpty } = useTestFiltering(
    allTests,
    filterTest
  );

  if (!ordersContext || !testsContext || !patientsContext || !samplesContext) return <div>Loading...</div>;

  const { updateTestStatus } = ordersContext;
  const { getTest } = testsContext;

  const handleResultChange = (resultKey: string, paramCode: string, value: string) => {
    setResults(prev => ({
      ...prev,
      [resultKey]: {
        ...(prev[resultKey] || {}),
        [paramCode]: value ?? '',
      },
    }));
  };

  const handleNotesChange = (resultKey: string, notes: string) => {
    setTechnicianNotes(prev => ({
      ...prev,
      [resultKey]: notes ?? '',
    }));
  };

  const areAllParametersFilled = (resultKey: string, parameterCount: number): boolean => {
    const testResults = results[resultKey];
    if (!testResults) return false;
    const filledCount = Object.values(testResults).filter(v => v && v.trim() !== '').length;
    return filledCount === parameterCount;
  };

  const handleSaveResults = (orderId: string, testCode: string, finalResults?: Record<string, string>, finalNotes?: string) => {
    const resultKey = `${orderId}-${testCode}`;
    // Use provided finalResults if available, otherwise fall back to state
    const testResults = finalResults || results[resultKey];
    if (!testResults || Object.keys(testResults).length === 0) {
      toast.error('No results to save');
      return;
    }

    const testDef = getTest(testCode);
    if (!testDef || !testDef.parameters) {
      toast.error('Test parameters not found');
      return;
    }

    const formattedResults: Record<string, TestResult> = {};
    const flags: string[] = [];

    // Get patient for demographic-specific ranges
    const testItem = allTests.find(t => t.orderId === orderId && t.testCode === testCode);
    const patient = testItem?.patient;

    testDef.parameters.forEach(param => {
      const value = testResults[param.code];
      if (!value) return;

      // Handle different value types
      let status: TestResult['status'] = 'normal';
      let processedValue: string | number = value;

      if (param.valueType === 'NUMERIC' || param.type === 'numeric') {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          processedValue = numValue;
          // Use enhanced reference range checking with demographics
          status = checkReferenceRangeWithDemographics(numValue, param, patient);
          
          // Check critical range if available
          if (param.criticalLow !== undefined && numValue < param.criticalLow) {
            status = 'critical';
          } else if (param.criticalHigh !== undefined && numValue > param.criticalHigh) {
            status = 'critical';
          }
        }
      } else if (param.valueType === 'SELECT' || param.type === 'select') {
        // For SELECT type, validate against allowed values
        if (param.allowedValues && !param.allowedValues.includes(value)) {
          toast.error(`${param.name}: Invalid value. Must be one of: ${param.allowedValues.join(', ')}`);
          return;
        }
        status = 'normal'; // SELECT values are typically qualitative
      } else {
        // TEXT type - no range checking
        status = 'normal';
      }

      formattedResults[param.code] = {
        value: processedValue,
        unit: param.unit,
        referenceRange: param.referenceRange,
        status,
      };

      if (status === 'high' || status === 'low') {
        flags.push(`${param.name} ${status}`);
      } else if (status === 'critical') {
        flags.push(`${param.name} CRITICAL`);
      }
    });

    updateTestStatus(orderId, testCode, 'completed', {
      results: formattedResults,
      resultEnteredAt: new Date().toISOString(),
      enteredBy: currentUser?.id,
      flags: flags.length > 0 ? flags : undefined,
      technicianNotes: finalNotes || technicianNotes[resultKey] || undefined,
    });

    toast.success('Results saved successfully');
    setResults(prev => {
      const newResults = { ...prev };
      delete newResults[resultKey];
      return newResults;
    });
    setTechnicianNotes(prev => {
      const newNotes = { ...prev };
      delete newNotes[resultKey];
      return newNotes;
    });
  };

  const openTestModal = (test: TestWithContext) => {
    const testDef = getTest(test.testCode);
    const resultKey = `${test.orderId}-${test.testCode}`;
    
    // Check if testDef exists
    if (!testDef || !testDef.parameters) return;

    const areParametersFilled = (key: string, count: number) => {
        const r = results[key];
        if (!r) return false;
        return Object.values(r).filter(v => v && v.trim() !== '').length === count;
    };
    
    const isComplete = areParametersFilled(resultKey, testDef.parameters.length);

    // Find index in filtered list for navigation
    const currentIndex = filteredTests.findIndex(
      t => t.orderId === test.orderId && t.testCode === test.testCode
    );
    
    // Define navigation callbacks - using recursive calls
    const onNext = currentIndex < filteredTests.length - 1
      ? () => openTestModal(filteredTests[currentIndex + 1])
      : undefined;
      
    const onPrev = currentIndex > 0
      ? () => openTestModal(filteredTests[currentIndex - 1])
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
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h3 className="text-base font-medium text-gray-900">Result Entry</h3>
        </div>

        {allTests.length > 0 && (
          <div className="w-full md:w-72">
            <SearchBar
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tests..."
              size="sm"
            />
          </div>
        )}
      </div>

      <div className="grid gap-4">
        {filteredTests.map((test, idx) => {
          const testDef = getTest(test.testCode);
          const resultKey = `${test.orderId}-${test.testCode}`;
          const isComplete = testDef?.parameters
            ? areAllParametersFilled(resultKey, testDef.parameters.length)
            : false;

          return (
            <ResultEntryCard
              key={`${test.orderId}-${test.testCode}-${idx}`}
              test={test}
              testDef={testDef}
              resultKey={resultKey}
              results={results[resultKey] || {}}
              technicianNotes={technicianNotes[resultKey] || ''}
              isComplete={isComplete}
              onResultsChange={handleResultChange}
              onNotesChange={handleNotesChange}
              onSave={(finalResults?: Record<string, string>, finalNotes?: string) => handleSaveResults(test.orderId, test.testCode, finalResults, finalNotes)}
              onClick={() => openTestModal(test)}
            />
          );
        })}

        {allTests.length === 0 && <EmptyState type="no-results" />}

        {allTests.length > 0 && isEmpty && (
          <EmptyState type="search" searchQuery={searchQuery} />
        )}
      </div>
    </div>
  );
};
