/**
 * LabWorkflowContext
 *
 * Central state management for lab workflow operations.
 * Provides a unified interface for samples, tests, and rejection operations.
 */

import React, { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import { sampleAPI } from '@/services/api/samples';
import { resultAPI } from '@/services/api/results';
import type { Sample, OrderTest } from '@/types';
import type { RejectionResult, RejectionOptionsResponse } from '@/types/lab-operations';

/**
 * Current workflow stage in the lab process
 */
type WorkflowStage = 'collection' | 'entry' | 'validation' | null;

/**
 * Active modal type
 */
type ModalType = 'rejection' | 'details' | 'collection' | null;

/**
 * Pending operation state
 */
interface PendingOperation {
  type: 'collect' | 'reject' | 'enter_results' | 'validate' | 'reject_results';
  entityId: string;
  entityType: 'sample' | 'test';
}

/**
 * Lab workflow state
 */
interface LabWorkflowState {
  currentStage: WorkflowStage;
  selectedSample: Sample | null;
  selectedTest: OrderTest | null;
  pendingOperation: PendingOperation | null;
  activeModal: ModalType;
  isLoading: boolean;
  error: string | null;
}

/**
 * Lab workflow context value
 */
interface LabWorkflowContextValue extends LabWorkflowState {
  // Selection actions
  selectSample: (sample: Sample | null) => void;
  selectTest: (test: OrderTest | null) => void;

  // Modal actions
  openRejectionDialog: (test: OrderTest) => void;
  openDetailsModal: (test: OrderTest) => void;
  closeModals: () => void;

  // Sample operations
  collectSample: (
    sampleId: string,
    data: {
      collectedVolume: number;
      containerType: string;
      containerColor: string;
      collectionNotes?: string;
    }
  ) => Promise<Sample | null>;
  rejectSample: (
    sampleId: string,
    data: {
      rejectionReasons: string[];
      rejectionNotes?: string;
      recollectionRequired?: boolean;
    }
  ) => Promise<Sample | null>;
  requestRecollection: (sampleId: string, reason: string) => Promise<Sample | null>;

  // Result operations
  enterResults: (
    orderId: string,
    testCode: string,
    data: {
      results: Record<string, unknown>;
      technicianNotes?: string;
    }
  ) => Promise<OrderTest | null>;
  validateResults: (
    orderId: string,
    testCode: string,
    validationNotes?: string
  ) => Promise<OrderTest | null>;
  rejectResults: (
    orderId: string,
    testCode: string,
    rejectionType: 're-test' | 're-collect',
    reason: string
  ) => Promise<RejectionResult | null>;
  getRejectionOptions: (orderId: string, testCode: string) => Promise<RejectionOptionsResponse | null>;

  // State management
  setStage: (stage: WorkflowStage) => void;
  clearError: () => void;
  resetState: () => void;
}

const LabWorkflowContext = createContext<LabWorkflowContextValue | null>(null);

/**
 * Hook to use the lab workflow context
 */
export function useLabWorkflow(): LabWorkflowContextValue {
  const context = useContext(LabWorkflowContext);
  if (!context) {
    throw new Error('useLabWorkflow must be used within a LabWorkflowProvider');
  }
  return context;
}

/**
 * Provider props
 */
interface LabWorkflowProviderProps {
  children: ReactNode;
  /** Initial workflow stage */
  initialStage?: WorkflowStage;
}

/**
 * Lab Workflow Provider
 *
 * Provides centralized state management for lab workflow operations.
 */
export const LabWorkflowProvider: React.FC<LabWorkflowProviderProps> = ({
  children,
  initialStage = null,
}) => {
  // State
  const [currentStage, setCurrentStage] = useState<WorkflowStage>(initialStage);
  const [selectedSample, setSelectedSample] = useState<Sample | null>(null);
  const [selectedTest, setSelectedTest] = useState<OrderTest | null>(null);
  const [pendingOperation, setPendingOperation] = useState<PendingOperation | null>(null);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selection actions
  const selectSample = useCallback((sample: Sample | null) => {
    setSelectedSample(sample);
    setError(null);
  }, []);

  const selectTest = useCallback((test: OrderTest | null) => {
    setSelectedTest(test);
    setError(null);
  }, []);

  // Modal actions
  const openRejectionDialog = useCallback((test: OrderTest) => {
    setSelectedTest(test);
    setActiveModal('rejection');
  }, []);

  const openDetailsModal = useCallback((test: OrderTest) => {
    setSelectedTest(test);
    setActiveModal('details');
  }, []);

  const closeModals = useCallback(() => {
    setActiveModal(null);
  }, []);

  // Sample operations
  const collectSample = useCallback(
    async (
      sampleId: string,
      data: {
        collectedVolume: number;
        containerType: string;
        containerColor: string;
        collectionNotes?: string;
      }
    ): Promise<Sample | null> => {
      setIsLoading(true);
      setError(null);
      setPendingOperation({ type: 'collect', entityId: sampleId, entityType: 'sample' });

      try {
        const sample = await sampleAPI.collect(sampleId, {
          collectedVolume: data.collectedVolume,
          actualContainerType: data.containerType as never,
          actualContainerColor: data.containerColor as never,
          collectionNotes: data.collectionNotes,
        });
        return sample;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to collect sample';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
        setPendingOperation(null);
      }
    },
    []
  );

  const rejectSample = useCallback(
    async (
      sampleId: string,
      data: {
        rejectionReasons: string[];
        rejectionNotes?: string;
        recollectionRequired?: boolean;
      }
    ): Promise<Sample | null> => {
      setIsLoading(true);
      setError(null);
      setPendingOperation({ type: 'reject', entityId: sampleId, entityType: 'sample' });

      try {
        const sample = await sampleAPI.reject(sampleId, {
          rejectionReasons: data.rejectionReasons as never[],
          rejectionNotes: data.rejectionNotes,
          recollectionRequired: data.recollectionRequired,
        });
        return sample;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to reject sample';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
        setPendingOperation(null);
      }
    },
    []
  );

  const requestRecollection = useCallback(
    async (sampleId: string, reason: string): Promise<Sample | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const sample = await sampleAPI.requestRecollection(sampleId, reason);
        return sample;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to request recollection';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Result operations
  const enterResults = useCallback(
    async (
      orderId: string,
      testCode: string,
      data: {
        results: Record<string, unknown>;
        technicianNotes?: string;
      }
    ): Promise<OrderTest | null> => {
      setIsLoading(true);
      setError(null);
      setPendingOperation({ type: 'enter_results', entityId: `${orderId}_${testCode}`, entityType: 'test' });

      try {
        const test = await resultAPI.enterResults(orderId, testCode, data);
        return test;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to enter results';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
        setPendingOperation(null);
      }
    },
    []
  );

  const validateResults = useCallback(
    async (
      orderId: string,
      testCode: string,
      validationNotes?: string
    ): Promise<OrderTest | null> => {
      setIsLoading(true);
      setError(null);
      setPendingOperation({ type: 'validate', entityId: `${orderId}_${testCode}`, entityType: 'test' });

      try {
        const test = await resultAPI.validateResults(orderId, testCode, {
          decision: 'approved',
          validationNotes,
        });
        return test;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to validate results';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
        setPendingOperation(null);
      }
    },
    []
  );

  const rejectResults = useCallback(
    async (
      orderId: string,
      testCode: string,
      rejectionType: 're-test' | 're-collect',
      reason: string
    ): Promise<RejectionResult | null> => {
      setIsLoading(true);
      setError(null);
      setPendingOperation({ type: 'reject_results', entityId: `${orderId}_${testCode}`, entityType: 'test' });

      try {
        const result = await resultAPI.rejectResults(orderId, testCode, {
          rejectionReason: reason,
          rejectionType,
        });
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to reject results';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
        setPendingOperation(null);
      }
    },
    []
  );

  const getRejectionOptions = useCallback(
    async (orderId: string, testCode: string): Promise<RejectionOptionsResponse | null> => {
      try {
        return await resultAPI.getRejectionOptions(orderId, testCode);
      } catch (err) {
        console.error('Failed to get rejection options:', err);
        return null;
      }
    },
    []
  );

  // State management
  const setStage = useCallback((stage: WorkflowStage) => {
    setCurrentStage(stage);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const resetState = useCallback(() => {
    setCurrentStage(null);
    setSelectedSample(null);
    setSelectedTest(null);
    setPendingOperation(null);
    setActiveModal(null);
    setIsLoading(false);
    setError(null);
  }, []);

  // Memoize context value
  const value = useMemo<LabWorkflowContextValue>(
    () => ({
      // State
      currentStage,
      selectedSample,
      selectedTest,
      pendingOperation,
      activeModal,
      isLoading,
      error,

      // Selection actions
      selectSample,
      selectTest,

      // Modal actions
      openRejectionDialog,
      openDetailsModal,
      closeModals,

      // Sample operations
      collectSample,
      rejectSample,
      requestRecollection,

      // Result operations
      enterResults,
      validateResults,
      rejectResults,
      getRejectionOptions,

      // State management
      setStage,
      clearError,
      resetState,
    }),
    [
      currentStage,
      selectedSample,
      selectedTest,
      pendingOperation,
      activeModal,
      isLoading,
      error,
      selectSample,
      selectTest,
      openRejectionDialog,
      openDetailsModal,
      closeModals,
      collectSample,
      rejectSample,
      requestRecollection,
      enterResults,
      validateResults,
      rejectResults,
      getRejectionOptions,
      setStage,
      clearError,
      resetState,
    ]
  );

  return (
    <LabWorkflowContext.Provider value={value}>
      {children}
    </LabWorkflowContext.Provider>
  );
};
