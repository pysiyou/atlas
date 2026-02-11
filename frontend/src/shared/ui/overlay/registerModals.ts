/**
 * Modal Registration
 * Registers all modals with the registry. getProps receives typed props per ModalType.
 */

import { ModalType } from '@/shared/context/ModalContext';
import { registerModal } from './modalRegistry';
import { CollectionDetailModal } from '@/features/lab/collection/CollectionDetailModal';
import { EntryDetailModal } from '@/features/lab/entry/EntryDetailModal';
import { ValidationDetailModal } from '@/features/lab/validation/ValidationDetailModal';
import { EscalationResolutionModal } from '@/features/lab/validation/EscalationResolutionModal';
import { OrderUpsertModal } from '@/features/order/components/OrderUpsertModal';

// Register Collection Detail Modal (Sample Detail)
registerModal(ModalType.SAMPLE_DETAIL, CollectionDetailModal, (props, baseProps, helpers) => {
  if ('sampleId' in props && props.sampleId) {
    const sample = helpers.getSample(props.sampleId);
    if (!sample) return null;
    return { ...baseProps, sampleId: props.sampleId };
  }
  if ('pendingSampleDisplay' in props && props.pendingSampleDisplay) {
    return { ...baseProps, pendingSampleDisplay: props.pendingSampleDisplay, onCollect: props.onCollect };
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
  onCommentsChange: props.onCommentsChange,
  onApprove: props.onApprove,
  onReject: props.onReject,
  orderHasValidatedTests: props.orderHasValidatedTests,
}));

// Register Escalation Resolution Modal (admin/labtech_plus only)
registerModal(ModalType.ESCALATION_RESOLUTION_DETAIL, EscalationResolutionModal, (props, baseProps) => ({
  ...baseProps,
  test: props.test,
  onResolved: props.onResolved,
}));

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
