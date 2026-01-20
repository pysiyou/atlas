/**
 * ResultValidationView - Main view for result validation workflow
 * 
 * Displays tests awaiting validation (status: completed and not yet validated).
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useOrders } from '@/features/order/OrderContext';
import { useTests } from '@/features/test/TestsContext';
import { usePatients } from '@/hooks';
import { useSamples } from '@/features/lab/SamplesContext';
import { getPatientName, getTestName, getTestSampleType } from '@/utils/typeHelpers';
import toast from 'react-hot-toast';
import { logger } from '@/utils/logger';
import { ResultValidationCard } from './ValidationCard';
import { useModal, ModalType } from '@/shared/contexts/ModalContext';
import { LabWorkflowView, createLabItemFilter } from '../shared/LabWorkflowView';
import type { TestWithContext, CollectedSample } from '@/types';
import { resultAPI } from '@/services/api';

export const ResultValidation: React.FC = () => {
  const ordersContext = useOrders();
  const testsContext = useTests();
  const patientsContext = usePatients();
  const samplesContext = useSamples();
  const { openModal } = useModal();
  const [comments, setComments] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState<Record<string, boolean>>({});

  // Build list of tests awaiting validation
  // Excludes superseded tests (those replaced by retests)
  const allTests: TestWithContext[] = useMemo(() => {
    if (!ordersContext || !testsContext || !patientsContext || !samplesContext) return [];

    return ordersContext.orders.flatMap(order => {
      const patientName = getPatientName(order.patientId, patientsContext.patients);

      return order.tests
        .filter(test =>
          // Filter for tests awaiting validation (completed but not yet validated)
          // Superseded tests are already excluded by status check
          test.status === 'completed' &&
          !test.validatedBy
        )
        .map(test => {
          const testName = getTestName(test.testCode, testsContext.tests);
          const sampleType = getTestSampleType(test.testCode, testsContext.tests);
          const sample = test.sampleId ? samplesContext.getSample(test.sampleId) : undefined;
          
          const collectedAt = sample?.status === 'collected' 
            ? (sample as CollectedSample).collectedAt : undefined;
          const collectedBy = sample?.status === 'collected'
            ? (sample as CollectedSample).collectedBy : undefined;

          return {
            ...test,
            orderId: order.orderId,
            patientId: order.patientId,
            patientName,
            testName,
            sampleType,
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

  const handleCommentsChange = useCallback((commentKey: string, value: string) => {
    setComments(prev => ({ ...prev, [commentKey]: value }));
  }, []);

  /**
   * Handle validation (approval or rejection) of test results.
   * 
   * @param orderId - Order ID
   * @param testCode - Test code
   * @param approve - True for approval, false for rejection
   * @param rejectionNotes - Reason for rejection (if rejecting)
   * @param rejectionType - Type of rejection action (if rejecting)
   * 
   * NOTE: When called with approve=false and BOTH rejectionNotes and rejectionType
   * are undefined, this indicates the rejection was already performed by the
   * RejectionDialog and we only need to refresh the data.
   */
  const handleValidate = useCallback(async (
    orderId: string,
    testCode: string,
    approve: boolean,
    rejectionNotes?: string,
    rejectionType?: 're-test' | 're-collect'
  ) => {
    if (!ordersContext) return;

    const commentKey = `${orderId}-${testCode}`;

    // Prevent concurrent validations
    if (isValidating[commentKey]) {
      return;
    }

    setIsValidating(prev => ({ ...prev, [commentKey]: true }));

    try {
      if (approve) {
        // Use validate endpoint for approvals
        await resultAPI.validateResults(orderId, testCode, {
          decision: 'approved',
          validationNotes: comments[commentKey] || undefined,
        });
        await ordersContext.refreshOrders();
        toast.success('Results approved');
      } else {
        // Check if the rejection was already performed by the RejectionDialog.
        // When both rejectionNotes and rejectionType are undefined, the dialog
        // already called the API and we only need to refresh the data.
        const alreadyRejected = rejectionNotes === undefined && rejectionType === undefined;

        if (alreadyRejected) {
          // Rejection was already performed by RejectionDialog - just refresh
          await ordersContext.refreshOrders();
          toast.success('Results rejected');
        } else {
          // Legacy path: rejection not yet performed, we need to call the API
          if (!rejectionNotes) {
            const confirmed = window.confirm('Are you sure you want to reject these results?');
            if (!confirmed) {
              setIsValidating(prev => ({ ...prev, [commentKey]: false }));
              return;
            }
          }

          const rejectType = rejectionType || 're-test';  // Default to re-test
          await resultAPI.rejectResults(orderId, testCode, {
            rejectionReason: rejectionNotes || 'Rejected by validator',
            rejectionType: rejectType,
          });
          await ordersContext.refreshOrders();

          const message = rejectType === 're-collect'
            ? 'Sample rejected - new collection required'
            : 'Results rejected - re-test created';
          toast.error(message);
        }
      }

      // Clear local state
      setComments(prev => { const n = { ...prev }; delete n[commentKey]; return n; });
    } catch (error) {
      logger.error('Error validating results', error instanceof Error ? error : undefined);
      // Extract error message from API error (APIError interface has a message property)
      const errorMessage = error && typeof error === 'object' && 'message' in error
        ? (error as { message: string }).message
        : 'Unknown error';
      toast.error(`Failed to validate results: ${errorMessage}`);
    } finally {
      setIsValidating(prev => ({ ...prev, [commentKey]: false }));
    }
  }, [comments, ordersContext, isValidating]);

  const openValidationModal = useCallback((test: TestWithContext) => {
    const commentKey = `${test.orderId}-${test.testCode}`;

    openModal(ModalType.VALIDATION_DETAIL, {
      test,
      commentKey,
      comments: comments[commentKey] || '',
      onCommentsChange: handleCommentsChange,
      onApprove: () => handleValidate(test.orderId, test.testCode, true),
      // When RejectionDialogContent is used, it calls the API directly.
      // Undefined values signal that the API was already called.
      onReject: (reason?: string, type?: 're-test' | 're-collect') =>
        handleValidate(test.orderId, test.testCode, false, reason, type),
    });
  }, [comments, handleCommentsChange, handleValidate, openModal]);

  if (!ordersContext || !testsContext || !patientsContext || !samplesContext) {
    return <div>Loading...</div>;
  }

  return (
    <LabWorkflowView
      title="Result Validation"
      items={allTests}
      filterFn={filterTest}
      renderCard={(test) => {
        const commentKey = `${test.orderId}-${test.testCode}`;
        return (
          <ResultValidationCard
            test={test}
            commentKey={commentKey}
            comments={comments[commentKey] || ''}
            onCommentsChange={handleCommentsChange}
            onApprove={() => handleValidate(test.orderId, test.testCode, true)}
            onReject={(reason, type) => handleValidate(test.orderId, test.testCode, false, reason, type)}
            onClick={() => openValidationModal(test)}
          />
        );
      }}
      getItemKey={(test, idx) => `${test.orderId}-${test.testCode}-${idx}`}
      emptyIcon="shield-check"
      emptyTitle="No Pending Validations"
      emptyDescription="There are no results waiting for validation."
      searchPlaceholder="Search tests..."
    />
  );
};
