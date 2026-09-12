/**
 * Modal Registration — single place to register app modals.
 * Add new modals here: registerModal(ModalType.X, Component, getProps).
 */

import { ModalType } from '@/lib/context/ModalContext';
import { registerModal } from './modalRegistry';
import { CollectionDetailModal } from '@/features/lab/collection/CollectionDetailModal';
import { EntryDetailModal } from '@/features/lab/entry/EntryDetailModal';
import { ValidationDetailModal } from '@/features/lab/validation/ValidationDetailModal';
import { EscalationResolutionModal } from '@/features/lab/validation/EscalationResolutionModal';
import { OrderUpsertModal } from '@/features/orders';

// Register Collection Detail Modal (Sample Detail)
registerModal(ModalType.SAMPLE_DETAIL, CollectionDetailModal, (props, baseProps, helpers) => {
  if ('sampleId' in props && props.sampleId) {
    if (!props.readOnly) {
      const sample = helpers.getSample(props.sampleId);
      if (!sample) return null;
    }
    return { ...baseProps, sampleId: props.sampleId, readOnly: props.readOnly };
  }
  if ('pendingSampleDisplay' in props && props.pendingSampleDisplay) {
    return {
      ...baseProps,
      pendingSampleDisplay: props.pendingSampleDisplay,
      onCollect: props.onCollect,
    };
  }
  return null;
});

// Register Entry Detail Modal (Result Detail)
registerModal(ModalType.RESULT_DETAIL, EntryDetailModal, (props, baseProps) => ({
  ...baseProps,
  test: props.test,
  testDef: props.testDef,
  resultKey: props.resultKey,
  results: props.results,
  technicianNotes: props.technicianNotes,
  isComplete: props.isComplete,
  readOnly: props.readOnly,
  onResultsChange: props.onResultsChange,
  onNotesChange: props.onNotesChange,
  onSave: props.onSave,
}));

// Register Validation Detail Modal
registerModal(ModalType.VALIDATION_DETAIL, ValidationDetailModal, (props, baseProps) => ({
  ...baseProps,
  test: props.test,
  commentKey: props.commentKey,
  comments: props.comments,
  readOnly: props.readOnly,
  onCommentsChange: props.onCommentsChange,
  onApprove: props.onApprove,
  onReject: props.onReject,
}));

// Register Escalation Resolution Modal (admin/labtech_plus only)
registerModal(
  ModalType.ESCALATION_RESOLUTION_DETAIL,
  EscalationResolutionModal,
  (props, baseProps) => ({
    ...baseProps,
    test: props.test,
    readOnly: props.readOnly,
    onResolved: props.onResolved,
  })
);

// Register New Order / Edit Order Modal (OrderUpsertModal)
registerModal(ModalType.NEW_ORDER, OrderUpsertModal, (props, baseProps) => ({
  ...baseProps,
  patientId: props.patientId,
  order: props.order,
  mode: props.mode ?? (props.order ? 'edit' : 'create'),
}));

// Export a function to ensure this file is imported
export function initializeModalRegistry(): void {
  // Registration happens on module load
  // This function exists to ensure the module is imported
}
