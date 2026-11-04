import React from 'react';
import type { FeedbackId } from '@/types/generated/feedbackCatalog';
import { Button } from '@/components/primitives';
import { displayId } from '@/utils';
import type { EscalationResolutionAction } from '@/types/lab-operations';
import {
  ForceValidateAction,
  ResolutionPopover,
  RetestAction,
} from './EscalationResolutionPopover';

export interface EscalationResolveOptions {
  readBack?: import('@/types/lab-operations').CriticalReadBackPayload;
}

interface EscalationResolutionActionsProps {
  orderTestId?: number;
  resolving: boolean;
  requiresReadBack: boolean;
  validationNotesForceValidate: string;
  onValidationNotesForceValidateChange: (value: string) => void;
  readBackProviderName: string;
  onReadBackProviderNameChange: (value: string) => void;
  readBackProviderContact: string;
  onReadBackProviderContactChange: (value: string) => void;
  readBackConfirmed: boolean;
  onReadBackConfirmedChange: (value: boolean) => void;
  reasonAuthorizeRetest: string;
  onReasonAuthorizeRetestChange: (value: string) => void;
  reasonAuthorizeRecollect: string;
  onReasonAuthorizeRecollectChange: (value: string) => void;
  reasonFinalReject: string;
  onReasonFinalRejectChange: (value: string) => void;
  reasonCode?: string;
  allowForceValidate?: boolean;
  hasResults?: boolean;
  resolveAsync: (
    action: EscalationResolutionAction,
    reasonOrNotes?: string,
    options?: EscalationResolveOptions,
  ) => Promise<void>;
  onValidationError: (id: FeedbackId) => void;
}

function popoverSubtitle(orderTestId?: number, hint?: string): string {
  const label = orderTestId != null ? displayId.orderTest(orderTestId) : undefined;
  return [label, hint].filter(Boolean).join(' · ');
}

function isLimitEscalation(reasonCode: string | undefined): boolean {
  return reasonCode === 'LIMIT-HIT' || reasonCode === 'REJ-SAMP';
}

function visibleActions(
  reasonCode: string | undefined,
  hasResults: boolean,
  allowForceValidate: boolean,
) {
  const limitEscalation = isLimitEscalation(reasonCode);
  return {
    allowRetestSameSample:
      limitEscalation || (hasResults && (!reasonCode || reasonCode === 'LIMIT-HIT')),
    allowRecollect: limitEscalation || !reasonCode || reasonCode === 'LIMIT-HIT',
    showApplyAmendment: reasonCode === 'AMEND-RES' && hasResults,
    showForceValidate:
      allowForceValidate &&
      hasResults &&
      (limitEscalation || reasonCode === 'CRIT-VAL' || reasonCode === 'LIMIT-HIT' || !reasonCode),
  };
}

export const EscalationResolutionActions: React.FC<EscalationResolutionActionsProps> = ({
  orderTestId,
  resolving,
  requiresReadBack,
  validationNotesForceValidate,
  onValidationNotesForceValidateChange,
  readBackProviderName,
  onReadBackProviderNameChange,
  readBackProviderContact,
  onReadBackProviderContactChange,
  readBackConfirmed,
  onReadBackConfirmedChange,
  reasonAuthorizeRetest,
  onReasonAuthorizeRetestChange,
  reasonAuthorizeRecollect,
  onReasonAuthorizeRecollectChange,
  reasonFinalReject,
  onReasonFinalRejectChange,
  reasonCode,
  allowForceValidate = true,
  resolveAsync,
  onValidationError,
  hasResults = false,
}) => {
  const { allowRetestSameSample, allowRecollect, showApplyAmendment, showForceValidate } =
    visibleActions(reasonCode, hasResults, allowForceValidate);

  return (
    <div className="flex items-center gap-space-2 flex-nowrap justify-end w-full">
      <ResolutionPopover
        resolving={resolving}
        triggerLabel="Cancel Test"
        triggerVariant="danger"
        title="Cancel Test"
        subtitle={popoverSubtitle(orderTestId, 'Clinical reason (required)')}
        textareaId="escalation-cancel-test-reason"
        placeholder="e.g. Test no longer clinically indicated"
        value={reasonFinalReject}
        onChange={onReasonFinalRejectChange}
        confirmLabel="Confirm Cancel"
        confirmVariant="danger"
        disabled={!reasonFinalReject.trim()}
        onConfirm={async () => {
          if (!reasonFinalReject.trim()) {
            onValidationError('lab.escalation.cancel.reasonRequired');
            return false;
          }
          await resolveAsync('cancel_test', reasonFinalReject.trim());
        }}
      />

      {showApplyAmendment ? (
        <ResolutionPopover
          resolving={resolving}
          triggerLabel="Force Validate"
          triggerVariant="success"
          title="Force Validate"
          subtitle={popoverSubtitle(orderTestId, 'Validation notes (optional)')}
          textareaId="escalation-apply-amendment-notes"
          placeholder="e.g. Supervisor approved corrected values"
          value={validationNotesForceValidate}
          onChange={onValidationNotesForceValidateChange}
          confirmLabel="Force Validate"
          confirmVariant="success"
          onConfirm={() => resolveAsync('apply_amendment', validationNotesForceValidate)}
        />
      ) : showForceValidate ? (
        <ForceValidateAction
          orderTestId={orderTestId}
          resolving={resolving}
          requiresReadBack={requiresReadBack}
          validationNotesForceValidate={validationNotesForceValidate}
          onValidationNotesForceValidateChange={onValidationNotesForceValidateChange}
          readBackProviderName={readBackProviderName}
          onReadBackProviderNameChange={onReadBackProviderNameChange}
          readBackProviderContact={readBackProviderContact}
          onReadBackProviderContactChange={onReadBackProviderContactChange}
          readBackConfirmed={readBackConfirmed}
          onReadBackConfirmedChange={onReadBackConfirmedChange}
          resolveAsync={resolveAsync}
          onValidationError={onValidationError}
        />
      ) : (
        <Button variant="success" size="sm" layout="text" disabled>
          Force Validate
        </Button>
      )}

      <RetestAction
        orderTestId={orderTestId}
        resolving={resolving}
        allowSameSample={allowRetestSameSample}
        allowRecollect={allowRecollect}
        reasonSameSample={reasonAuthorizeRetest}
        onReasonSameSampleChange={onReasonAuthorizeRetestChange}
        reasonRecollect={reasonAuthorizeRecollect}
        onReasonRecollectChange={onReasonAuthorizeRecollectChange}
        resolveAsync={resolveAsync}
        onValidationError={onValidationError}
      />
    </div>
  );
};
