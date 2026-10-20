/**
 * Modal Registry — lazy components keyed by ModalType.
 * Frames are already typed; the renderer spreads payload + base props.
 */

import { lazy, type ComponentType } from 'react';
import { ModalType } from '@/lib/context/ModalContext';
import type { BaseModalProps, ModalType as ModalTypeName } from '@/lib/context/modalTypes';

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
const ReportPreviewModal = lazy(() =>
  import('@/features/reports/components/ReportPreviewModal').then(module => ({
    default: module.ReportPreviewModal,
  }))
);

export type { BaseModalProps } from '@/lib/context/modalTypes';

/** Renderer spreads the matching frame payload; registry does not encode each variant. */
type RegisteredModalComponent = ComponentType<BaseModalProps & Record<string, unknown>>;

export interface ModalRegistryEntry {
  component: RegisteredModalComponent;
}

const registry: Partial<Record<ModalTypeName, ModalRegistryEntry>> = {};

function registerModal(type: ModalTypeName, component: RegisteredModalComponent): void {
  registry[type] = { component };
}

export function getRegisteredModal(type: ModalTypeName): ModalRegistryEntry | undefined {
  return registry[type];
}

registerModal(
  ModalType.SAMPLE_DETAIL,
  SampleCollectionDetailModal as unknown as RegisteredModalComponent
);
registerModal(
  ModalType.RESULT_DETAIL,
  ResultEntryDetailModal as unknown as RegisteredModalComponent
);
registerModal(ModalType.TEST_DETAIL, TestDetailModal as unknown as RegisteredModalComponent);
registerModal(
  ModalType.ESCALATION_RESOLUTION_DETAIL,
  EscalationResolutionModal as unknown as RegisteredModalComponent
);
registerModal(ModalType.NEW_ORDER, OrderUpsertModal as unknown as RegisteredModalComponent);
registerModal(
  ModalType.REPORT_PREVIEW,
  ReportPreviewModal as unknown as RegisteredModalComponent
);

/** Side-effect import hook so registration runs on module load. */
export function initializeModalRegistry(): void {
  // Registration happens on module load
}
