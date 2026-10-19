/**
 * Modal Registry
 * Maps modal types to their component configurations.
 * getProps receives typed modalProps per ModalType via ModalPropsMap.
 */

import { lazy, type ComponentType } from 'react';
import { ModalType } from '@/lib/context/ModalContext';
import type { ModalPropsMap, BaseModalProps } from '@/lib/context/modalTypes';

const SampleCollectionDetailModal = lazy(() =>
  import('@/features/lab/workflow/detailModal.sampleCollection').then(module => ({
    default: module.SampleCollectionDetailModal,
  }))
);
const ResultEntryDetailModal = lazy(() =>
  import('@/features/lab/workflow/detailModal.resultEntry').then(module => ({
    default: module.ResultEntryDetailModal,
  }))
);
const TestDetailModal = lazy(() =>
  import('@/features/lab/workflow/detailModal.test').then(module => ({
    default: module.TestDetailModal,
  }))
);
const EscalationResolutionModal = lazy(() =>
  import('@/features/lab/workflow/detailModal.escalation').then(module => ({
    default: module.EscalationResolutionModal,
  }))
);
const OrderUpsertModal = lazy(() =>
  import('@/features/orders/OrderUpsertModal').then(module => ({
    default: module.OrderUpsertModal,
  }))
);

/**
 * Base props that all modals receive
 */
export type { BaseModalProps } from '@/lib/context/modalTypes';

/**
 * Registry entry: component + getProps. At runtime getProps receives Record<string, unknown>;
 * registerModal types getProps per ModalType for type-safe registration.
 */
export interface ModalRegistryEntry {
  component: ComponentType<BaseModalProps>;
  getProps: (
    modalProps: Record<string, unknown>,
    baseProps: BaseModalProps,
    helpers: ModalHelpers
  ) => BaseModalProps | null;
}

/**
 * Helpers available to modal prop extractors
 */
export interface ModalHelpers {
  getSample: (sampleId: string) => unknown;
}

const registry: Partial<Record<ModalType, ModalRegistryEntry>> = {};

/**
 * Register a modal. getProps is typed to receive ModalPropsMap[T] for type-safe registration.
 */
function registerModal<T extends ModalType, P extends BaseModalProps>(
  type: T,
  component: ComponentType<P>,
  getProps: (
    modalProps: ModalPropsMap[T],
    baseProps: BaseModalProps,
    helpers: ModalHelpers
  ) => P | null
): void {
  registry[type] = {
    component: component as ComponentType<BaseModalProps>,
    getProps: getProps as unknown as ModalRegistryEntry['getProps'],
  };
}

/**
 * Get a registered modal
 */
export function getRegisteredModal(type: ModalType): ModalRegistryEntry | undefined {
  return registry[type];
}

registerModal(ModalType.SAMPLE_DETAIL, SampleCollectionDetailModal, (props, baseProps) => {
  if ('sampleId' in props && props.sampleId) {
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

registerModal(ModalType.RESULT_DETAIL, ResultEntryDetailModal, (props, baseProps) => ({
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

registerModal(ModalType.TEST_DETAIL, TestDetailModal, (props, baseProps) => ({
  ...baseProps,
  orderTestId: props.orderTestId,
  order: props.order,
  orderTest: props.orderTest,
  patient: props.patient,
  test: props.test,
  interaction: props.interaction,
  validation: props.validation,
}));

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

registerModal(ModalType.NEW_ORDER, OrderUpsertModal, (props, baseProps) => ({
  ...baseProps,
  patientId: props.patientId,
  order: props.order,
  mode: props.mode ?? (props.order ? 'edit' : 'create'),
}));

/** Side-effect import hook so registration runs on module load. */
export function initializeModalRegistry(): void {
  // Registration happens on module load
}
