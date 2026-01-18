import React, { useState } from 'react';
import { useOrders } from '@/features/order/OrderContext';
import { useTests } from '@/features/test/TestsContext';
import { usePatients } from '@/hooks';
import { useSamples } from '@/features/lab/SamplesContext';
import { getPatientName, getTestName, getTestSampleType } from '@/utils/typeHelpers';
import toast from 'react-hot-toast';
import { SearchBar, EmptyState } from '@/shared/ui';
import { ResultValidationCard } from './ValidationCard';
import { useModal, ModalType } from '@/shared/contexts/ModalContext';
import { useSearch } from '@/utils/filtering';
import type { TestWithContext } from '@/types';
import { resultAPI } from '@/services/api';
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
 * ResultValidation Component
 * 
 * Main list component for result validation. Displays all tests that need validation
 * (status: 'completed' and not yet validated). Manages overall state for validation
 * comments and handles approval/rejection.
 * 
 * Similar structure to ResultEntry - list component that renders ResultValidationCard
 * components for each test.
 */
export const ResultValidation: React.FC = () => {
  const ordersContext = useOrders();
  const testsContext = useTests();
  const patientsContext = usePatients();
  const samplesContext = useSamples();
  const { openModal } = useModal();
  const [comments, setComments] = useState<Record<string, string>>({});

  const allTests = ordersContext && testsContext && patientsContext && samplesContext
    ? ordersContext.orders.flatMap(order => {
        const patientName = getPatientName(order.patientId, patientsContext.patients);
        
        return order.tests
          .filter(test => test.status === 'completed' && !test.validatedBy)
          .map(test => {
            // Get test definition for name and sample type
            const testName = getTestName(test.testCode, testsContext.tests);
            const sampleType = getTestSampleType(test.testCode, testsContext.tests);
            
            // Get sample data if sampleId exists
            const sample = test.sampleId ? samplesContext.getSample(test.sampleId) : undefined;
            const collectedAt = sample && sample.status === 'collected' 
              ? (sample as import('@/types').CollectedSample).collectedAt 
              : undefined;
            const collectedBy = sample && sample.status === 'collected'
              ? (sample as import('@/types').CollectedSample).collectedBy
              : undefined;
            
            return {
              ...test,
              orderId: order.orderId,
              patientId: order.patientId,
              patientName,
              testName,
              sampleType,
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

  const { filteredItems: filteredTests, searchQuery, setSearchQuery, isEmpty } = useSearch(
    allTests,
    filterTest
  );

  if (!ordersContext || !testsContext || !patientsContext || !samplesContext) return <div>Loading...</div>;

  const handleCommentsChange = (commentKey: string, value: string) => {
    setComments(prev => ({
      ...prev,
      [commentKey]: value,
    }));
  };

  const handleValidate = async (
    orderId: string, 
    testCode: string, 
    approve: boolean,
    rejectionNotes?: string,
    rejectionType?: 're-test' | 're-collect'
  ) => {
    const commentKey = `${orderId}-${testCode}`;

    try {
      if (approve) {
        // Approve results via API
        await resultAPI.validateResults(orderId, testCode, {
          decision: 'approved',
          validationNotes: comments[commentKey] || undefined,
        });
        
        // Refresh orders from backend
        await ordersContext.refreshOrders();
        
        toast.success('Results approved');
      } else {
        if (!rejectionNotes) {
          // Fallback if no notes
          const confirmed = window.confirm(
            'Are you sure you want to reject these results?'
          );
          if (!confirmed) return;
        }

        // Determine decision based on rejection type
        const decision = rejectionType === 're-collect' ? 'repeat-required' : 'rejected';
        
        // Reject results via API
        await resultAPI.validateResults(orderId, testCode, {
          decision,
          validationNotes: rejectionNotes || 'Rejected by validator',
        });
        
        // Refresh orders from backend
        await ordersContext.refreshOrders();
        
        const message = rejectionType === 're-collect' 
          ? 'Sample rejected - new collection required' 
          : 'Results rejected - re-test required';
        toast.error(message);
      }

      // Clear local state
      setComments(prev => {
        const newComments = { ...prev };
        delete newComments[commentKey];
        return newComments;
      });
    } catch (error) {
      console.error('Error validating results:', error);
      toast.error('Failed to validate results. Please try again.');
    }
  };

  const openValidationModal = (test: TestWithContext) => {
    const commentKey = `${test.orderId}-${test.testCode}`;

    openModal(ModalType.VALIDATION_DETAIL, {
      test,
      commentKey,
      comments: comments[commentKey] || '',
      onCommentsChange: handleCommentsChange,
      onApprove: () => handleValidate(test.orderId, test.testCode, true),
      onReject: (reason: string, type: 're-test' | 're-collect') => handleValidate(test.orderId, test.testCode, false, reason, type),
    });
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between shrink-0">
        <div>
          <h3 className="text-base font-medium text-gray-900">Result Validation</h3>
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

      <div className={`flex-1 ${filteredTests.length === 0 ? 'flex flex-col' : 'grid gap-4 overflow-y-auto min-h-0'}`}>
        {filteredTests.map((test, idx) => {
          const commentKey = `${test.orderId}-${test.testCode}`;

          return (
            <ResultValidationCard
              key={`${test.orderId}-${test.testCode}-${idx}`}
              test={test}
              commentKey={commentKey}
              comments={comments[commentKey] || ''}
              onCommentsChange={handleCommentsChange}
              onApprove={() => handleValidate(test.orderId, test.testCode, true)}
              onReject={(reason, type) => handleValidate(test.orderId, test.testCode, false, reason, type)}
              onClick={() => openValidationModal(test)}
            />
          );
        })}

        {allTests.length === 0 && (
          <div className="flex-1">
            <EmptyState
              icon="shield-check"
              title="No Pending Validations"
              description="There are no results waiting for validation."
            />
          </div>
        )}

        {allTests.length > 0 && isEmpty && (
          <div className="flex-1">
            <EmptyState
              icon="search"
              title="No Matches Found"
              description={`No tests found matching "${searchQuery}"`}
            />
          </div>
        )}
      </div>
    </div>
  );
};
