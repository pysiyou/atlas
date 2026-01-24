/**
 * Modal Registration
 * Registers all modals with the registry
 * Import this file once at app startup
 */

import { ModalType } from '@/shared/context/ModalContext';
import { registerModal } from './modalRegistry';
import { CollectionDetailModal } from '@/features/lab/collection/CollectionDetailModal';
import { EntryDetailModal } from '@/features/lab/entry/EntryDetailModal';
import { ValidationDetailModal } from '@/features/lab/validation/ValidationDetailModal';
import { OrderCreateModal } from '@/features/order/modals/OrderCreateModal';

import type { ContainerType, SampleDisplay, Test, TestWithContext } from '@/types';

// Register Collection Detail Modal (Sample Detail)
registerModal(ModalType.SAMPLE_DETAIL, CollectionDetailModal, (props, baseProps, helpers) => {
  const { sampleId, pendingSampleDisplay, onCollect } = props as {
    sampleId?: string;
    pendingSampleDisplay?: SampleDisplay;
    onCollect?: (
      display: SampleDisplay,
      volume: number,
      notes?: string,
      selectedColor?: string,
      containerType?: ContainerType
    ) => void;
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
});

// Register Entry Detail Modal (Result Detail)
registerModal(ModalType.RESULT_DETAIL, EntryDetailModal, (props, baseProps) => {
  const {
    test,
    testDef,
    resultKey,
    results,
    technicianNotes,
    isComplete,
    onResultsChange,
    onNotesChange,
    onSave,
  } = props as {
    test: TestWithContext;
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
    test: test as TestWithContext,
    testDef,
    resultKey,
    results,
    technicianNotes,
    isComplete,
    onResultsChange,
    onNotesChange,
    onSave,
  };
});

// Register Validation Detail Modal
registerModal(ModalType.VALIDATION_DETAIL, ValidationDetailModal, (props, baseProps) => {
  const {
    test,
    commentKey,
    comments,
    onCommentsChange,
    onApprove,
    onReject,
    orderHasValidatedTests,
  } = props as {
    test: TestWithContext;
    commentKey: string;
    comments: string;
    onCommentsChange: (commentKey: string, comments: string) => void;
    onApprove: () => void;
    onReject: (reason?: string, type?: 're-test' | 're-collect') => void;
    /** When true, re-collect option is blocked due to validated tests in the order */
    orderHasValidatedTests?: boolean;
  };

  return {
    ...baseProps,
    test: test as TestWithContext,
    commentKey,
    comments,
    onCommentsChange,
    onApprove,
    onReject,
    orderHasValidatedTests,
  };
});

// Register New Order (Create Order) Modal
registerModal(ModalType.NEW_ORDER, OrderCreateModal, (props, baseProps) => {
  const { patientId } = props as { patientId?: string };
  return { ...baseProps, patientId };
});

// Export a function to ensure this file is imported
export function initializeModalRegistry(): void {
  // Registration happens on module load
  // This function exists to ensure the module is imported
}
