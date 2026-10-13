/**
 * Typed modal props per ModalType.
 * Used by openModal and getProps so modal boundaries are type-safe.
 */

import type { ModalType } from './ModalContext';
import type { Order, OrderTest, Patient, Test, TestWithContext, ContainerType } from '@/types';
import type { QualityIssueResult } from '@/types/lab-operations';
import type { SampleCollectionQueueItem } from '@/types/lab-operations';

/** Props every registered modal receives from ModalRenderer. */
export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Payload for opening the sample/collection detail modal by sample id. */
export interface SampleDetailByIdProps {
  sampleId: string;
  readOnly?: boolean;
}

/** Payload for opening the sample/collection detail modal with pending sample and collect callback. */
export interface SampleDetailPendingProps {
  pendingSampleDisplay: SampleCollectionQueueItem;
  onCollect?: (
    display: SampleCollectionQueueItem,
    volume: number,
    notes?: string,
    selectedColor?: string,
    containerType?: ContainerType
  ) => void;
}

/** Payload for result/entry detail modal. */
export interface ResultDetailProps {
  test: TestWithContext;
  testDef: Test | undefined;
  resultKey: string;
  results: Record<string, string>;
  technicianNotes: string;
  isComplete: boolean;
  readOnly?: boolean;
  onResultsChange: (resultKey: string, paramCode: string, value: string) => void;
  onNotesChange: (resultKey: string, notes: string) => void;
  onSave: (finalResults?: Record<string, string>, finalNotes?: string) => void;
}

/** Validation workflow callbacks when test detail modal is opened in validate mode. */
export interface TestDetailValidationSession {
  commentKey: string;
  comments: string;
  onCommentsChange: (commentKey: string, comments: string) => void;
  onApprove: () => void | Promise<void>;
  onReject: (result: QualityIssueResult) => void;
}

/** Unified test detail modal (view or validate). */
export interface TestDetailProps {
  orderTestId: number;
  order?: Order;
  orderTest?: OrderTest;
  patient?: Patient | null;
  test?: TestWithContext;
  interaction?: 'view' | 'validate';
  validation?: TestDetailValidationSession;
}

/** Payload for escalation resolution modal. */
export interface EscalationResolutionDetailProps {
  test: TestWithContext;
  readOnly?: boolean;
  onResolved: () => void | Promise<void>;
}

/** Payload for new/edit order modal. */
export interface OrderUpsertModalProps {
  patientId?: string;
  order?: Order;
  mode?: 'create' | 'edit';
}

/**
 * Map of ModalType to the props payload passed to openModal(type, props).
 * Unregistered modals use empty object.
 */
export interface ModalPropsMap {
  SAMPLE_DETAIL: SampleDetailByIdProps | SampleDetailPendingProps;
  RESULT_DETAIL: ResultDetailProps;
  ESCALATION_RESOLUTION_DETAIL: EscalationResolutionDetailProps;
  NEW_ORDER: OrderUpsertModalProps;
  TEST_DETAIL: TestDetailProps;
}

export type ModalPropsFor<T extends ModalType> = ModalPropsMap[T];
