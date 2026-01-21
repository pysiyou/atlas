/**
 * Modal Registration
 * Registers all modals with the registry
 * Import this file once at app startup
 */

import { ModalType } from '@/shared/contexts/ModalContext';
import { registerModal } from './modalRegistry';
import { SampleDetailModal } from '@/features/lab/sample-collection/SampleDetail';

import { ResultDetailModal } from '@/features/lab/result-entry/ResultDetail';
import { ValidationDetailModal } from '@/features/lab/result-validation/ValidationDetail';

import type { ContainerType, SampleDisplay, Test, Patient } from '@/types';

// Register Sample Detail Modal
registerModal(
  ModalType.SAMPLE_DETAIL,
  SampleDetailModal,
  (props, baseProps, helpers) => {
    const { sampleId, pendingSampleDisplay, onCollect } = props as {
      sampleId?: string;
      pendingSampleDisplay?: SampleDisplay;
      onCollect?: (display: SampleDisplay, volume: number, notes?: string, selectedColor?: string, containerType?: ContainerType) => void;
    };

    if (sampleId) {
      const sample = helpers.getSample(sampleId);
      if (!sample) return null;
      return { ...baseProps, sampleId };
    }

    if (pendingSampleDisplay) {
      return { ...baseProps, pendingSampleDisplay, onCollect };
    }

    return null;
  }
);



// Register Result Detail Modal
registerModal(
  ModalType.RESULT_DETAIL,
  ResultDetailModal,
  (props, baseProps) => {
    const {
      test, testDef, resultKey, results, technicianNotes, isComplete,
      onResultsChange, onNotesChange, onSave
    } = props as {
      test: {
        orderId: string;
        patientId: string;
        patientName: string;
        testName: string;
        testCode: string;
        sampleType?: string;
        sampleId?: string;
        priority: string;
        status: string;
        collectedAt?: string;
        collectedBy?: string;
        referringPhysician?: string;
        patient?: Patient;
        [key: string]: unknown;
      };
      testDef: Test | undefined;
      resultKey: string;
      results: Record<string, string>;
      technicianNotes: string;
      isComplete: boolean;
      onResultsChange: (resultKey: string, paramCode: string, value: string) => void;
      onNotesChange: (resultKey: string, notes: string) => void;
      onSave: (finalResults?: Record<string, string>, finalNotes?: string) => void;
    };

    return {
      ...baseProps,
      test, testDef, resultKey, results, technicianNotes, isComplete,
      onResultsChange, onNotesChange, onSave
    };
  }
);

// Register Validation Detail Modal
registerModal(
  ModalType.VALIDATION_DETAIL,
  ValidationDetailModal,
  (props, baseProps) => {
    const {
      test, commentKey, comments, onCommentsChange, onApprove, onReject, orderHasValidatedTests
    } = props as {
      test: {
        orderId: string;
        patientId: string;
        patientName: string;
        testName: string;
        testCode: string;
        priority: string;
        status: string;
        results?: Record<string, unknown>;
        flags?: string[];
        collectedAt?: string;
        collectedBy?: string;
        resultEnteredAt?: string;
        enteredBy?: string;
        [key: string]: unknown;
      };
      commentKey: string;
      comments: string;
      onCommentsChange: (commentKey: string, comments: string) => void;
      onApprove: () => void;
      onReject: (reason: string, type: 're-test' | 're-collect') => void;
      /** When true, re-collect option is blocked due to validated tests in the order */
      orderHasValidatedTests?: boolean;
    };

    return {
      ...baseProps,
      test, commentKey, comments, onCommentsChange, onApprove, onReject, orderHasValidatedTests
    };
  }
);



// Export a function to ensure this file is imported
export function initializeModalRegistry(): void {
  // Registration happens on module load
  // This function exists to ensure the module is imported
}
