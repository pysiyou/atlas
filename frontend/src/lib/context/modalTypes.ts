/**
 * Serializable modal frames. Context never stores functions, drafts, or entity blobs.
 */

export const ModalType = {
  SAMPLE_DETAIL: 'SAMPLE_DETAIL',
  RESULT_DETAIL: 'RESULT_DETAIL',
  ESCALATION_RESOLUTION_DETAIL: 'ESCALATION_RESOLUTION_DETAIL',
  NEW_ORDER: 'NEW_ORDER',
  TEST_DETAIL: 'TEST_DETAIL',
  REPORT_PREVIEW: 'REPORT_PREVIEW',
} as const;

export type ModalType = (typeof ModalType)[keyof typeof ModalType];

/** Nested lab opens are depth 2 today; cap at 3 so a mistaken loop cannot grow forever. */
export const MAX_MODAL_STACK_DEPTH = 3;

export type TestDetailInteraction = 'view' | 'validate';

export type ModalFrame =
  | { type: typeof ModalType.SAMPLE_DETAIL; sampleId: string; readOnly?: boolean }
  | { type: typeof ModalType.RESULT_DETAIL; orderTestId: number; readOnly?: boolean }
  | { type: typeof ModalType.TEST_DETAIL; orderTestId: number; interaction: TestDetailInteraction }
  | {
      type: typeof ModalType.ESCALATION_RESOLUTION_DETAIL;
      orderTestId: number;
      readOnly?: boolean;
    }
  | {
      type: typeof ModalType.NEW_ORDER;
      patientId?: string;
      orderId?: number;
      mode?: 'create' | 'edit';
    }
  | { type: typeof ModalType.REPORT_PREVIEW; orderId: number };

export type ModalStack = ModalFrame[];

/** Props every registered modal receives from ModalRenderer. */
export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** False when another frame is stacked on top — keep mounted, skip focus/Escape. */
  isActive?: boolean;
}

export type SampleDetailModalProps = BaseModalProps & {
  sampleId: string;
  readOnly?: boolean;
};

export type ResultDetailModalProps = BaseModalProps & {
  orderTestId: number;
  readOnly?: boolean;
};

export type TestDetailModalProps = BaseModalProps & {
  orderTestId: number;
  interaction: TestDetailInteraction;
};

export type EscalationResolutionModalProps = BaseModalProps & {
  orderTestId: number;
  readOnly?: boolean;
};

export type OrderUpsertModalOpenProps = BaseModalProps & {
  patientId?: string;
  orderId?: number;
  mode?: 'create' | 'edit';
};

export type ReportPreviewModalProps = BaseModalProps & {
  orderId: number;
};

/**
 * Replace the stack with a single root frame (page/card open).
 */
export function replaceModalStack(frame: ModalFrame): ModalStack {
  return [frame];
}

/**
 * Push a nested frame. At the depth cap, replace the top instead of growing.
 */
export function pushModalFrame(stack: ModalStack, frame: ModalFrame): ModalStack {
  if (stack.length === 0) return [frame];
  if (stack.length >= MAX_MODAL_STACK_DEPTH) {
    return [...stack.slice(0, -1), frame];
  }
  return [...stack, frame];
}

/** Pop the top frame. Empty stack means no modal is open. */
export function popModalStack(stack: ModalStack): ModalStack {
  if (stack.length === 0) return stack;
  return stack.slice(0, -1);
}

/** Stable React key so lower frames keep identity (and local state) across push/pop. */
export function modalFrameKey(frame: ModalFrame): string {
  switch (frame.type) {
    case ModalType.SAMPLE_DETAIL:
      return `${frame.type}:${frame.sampleId}:${frame.readOnly ? 'ro' : 'rw'}`;
    case ModalType.RESULT_DETAIL:
      return `${frame.type}:${frame.orderTestId}:${frame.readOnly ? 'ro' : 'rw'}`;
    case ModalType.TEST_DETAIL:
      return `${frame.type}:${frame.orderTestId}:${frame.interaction}`;
    case ModalType.ESCALATION_RESOLUTION_DETAIL:
      return `${frame.type}:${frame.orderTestId}:${frame.readOnly ? 'ro' : 'rw'}`;
    case ModalType.NEW_ORDER:
      return `${frame.type}:${frame.mode ?? 'create'}:${frame.orderId ?? ''}:${frame.patientId ?? ''}`;
    case ModalType.REPORT_PREVIEW:
      return `${frame.type}:${frame.orderId}`;
    default: {
      const exhaustive: never = frame;
      return exhaustive;
    }
  }
}

/** Strip the discriminant so the lazy component receives only its payload + base props. */
export function modalFramePayload(frame: ModalFrame): Omit<ModalFrame, 'type'> {
  const { type: _type, ...payload } = frame;
  return payload;
}
