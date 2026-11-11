/**
 * Modal Registry — lazy loaders keyed by ModalType (components load on first open).
 */

import type { ComponentType } from 'react';
import { ModalType } from '@/lib/context/ModalContext';
import type { BaseModalProps, ModalType as ModalTypeName } from '@/lib/context/modalTypes';

export type { BaseModalProps } from '@/lib/context/modalTypes';

/** Renderer spreads the matching frame payload; registry does not encode each variant. */
export type RegisteredModalComponent = ComponentType<BaseModalProps & Record<string, unknown>>;

export type ModalLoader = () => Promise<{ default: RegisteredModalComponent }>;

const MODAL_LOADERS: Partial<Record<ModalTypeName, ModalLoader>> = {
  [ModalType.SAMPLE_DETAIL]: () =>
    import('@/features/lab/workflow/modals/detailModal.sampleCollection').then(m => ({
      default: m.SampleCollectionDetailModal as unknown as RegisteredModalComponent,
    })),
  [ModalType.RESULT_DETAIL]: () =>
    import('@/features/lab/workflow/modals/detailModal.resultEntry').then(m => ({
      default: m.ResultEntryDetailModal as unknown as RegisteredModalComponent,
    })),
  [ModalType.TEST_DETAIL]: () =>
    import('@/features/lab/workflow/modals/detailModal.testDetail').then(m => ({
      default: m.TestDetailModal as unknown as RegisteredModalComponent,
    })),
  [ModalType.ESCALATION_RESOLUTION_DETAIL]: () =>
    import('@/features/lab/workflow/modals/detailModal.escalation').then(m => ({
      default: m.EscalationResolutionModal as unknown as RegisteredModalComponent,
    })),
  [ModalType.NEW_ORDER]: () =>
    import('@/features/orders/OrderUpsertModal').then(m => ({
      default: m.OrderUpsertModal as unknown as RegisteredModalComponent,
    })),
  [ModalType.REPORT_PREVIEW]: () =>
    import('@/features/reports').then(m => ({
      default: m.ReportPreviewModal as unknown as RegisteredModalComponent,
    })),
};

export function getModalLoader(type: ModalTypeName): ModalLoader | undefined {
  return MODAL_LOADERS[type];
}

export function isModalTypeRegistered(type: ModalTypeName): boolean {
  return type in MODAL_LOADERS;
}

/** Side-effect hook so registration module is loaded with ModalRenderer. */
export function initializeModalRegistry(): void {
  /* loaders registered at module init */
}
