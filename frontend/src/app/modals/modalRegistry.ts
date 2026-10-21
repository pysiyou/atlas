/**
 * Modal Registry — components keyed by ModalType.
 * Eager imports keep a single Modal instance per open (no Suspense shell swap).
 */

import type { ComponentType } from 'react';
import { ModalType } from '@/lib/context/ModalContext';
import type { BaseModalProps, ModalType as ModalTypeName } from '@/lib/context/modalTypes';
import {
  EscalationResolutionModal,
  ResultEntryDetailModal,
  SampleCollectionDetailModal,
  TestDetailModal,
} from '@/features/lab/workflow';
import { OrderUpsertModal } from '@/features/orders/OrderUpsertModal';
import { ReportPreviewModal } from '@/features/reports';

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
