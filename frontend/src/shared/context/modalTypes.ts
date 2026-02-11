/**
 * Typed modal props per ModalType.
 * Used by openModal and getProps so modal boundaries are type-safe.
 */

import type { ModalType } from './ModalContext';
import type { Order, Test, TestWithContext, ContainerType } from '@/types';
import type { SampleDisplay } from '@/features/lab/types';

/** Payload for opening the sample/collection detail modal by sample id. */
export interface SampleDetailByIdProps {
  sampleId: string;
}

/** Payload for opening the sample/collection detail modal with pending sample and collect callback. */
export interface SampleDetailPendingProps {
  pendingSampleDisplay: SampleDisplay;
  onCollect?: (
    display: SampleDisplay,
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
  onResultsChange: (resultKey: string, paramCode: string, value: string) => void;
  onNotesChange: (resultKey: string, notes: string) => void;
  onSave: (finalResults?: Record<string, string>, finalNotes?: string) => void;
  onNext?: () => void;
  onPrev?: () => void;
}

/** Payload for validation detail modal. */
export interface ValidationDetailProps {
  test: TestWithContext;
  commentKey: string;
  comments: string;
  onCommentsChange: (commentKey: string, comments: string) => void;
  onApprove: () => void;
  onReject: (reason?: string, type?: 're-test' | 're-collect') => void;
  orderHasValidatedTests?: boolean;
}

/** Payload for escalation resolution modal. */
export interface EscalationResolutionDetailProps {
  test: TestWithContext;
  onResolved: () => void | Promise<void>;
}

/** Payload for new/edit order modal. */
export interface NewOrderProps {
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
  PATIENT_DETAIL: Record<string, never>;
  ORDER_DETAIL: Record<string, never>;
  CONFIRMATION: Record<string, never>;
  RESULT_DETAIL: ResultDetailProps;
  VALIDATION_DETAIL: ValidationDetailProps;
  ESCALATION_RESOLUTION_DETAIL: EscalationResolutionDetailProps;
  NEW_ORDER: NewOrderProps;
}

export type ModalPropsFor<T extends ModalType> = ModalPropsMap[T];
