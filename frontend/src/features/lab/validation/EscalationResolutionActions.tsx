import React from 'react';
import { Icon } from '@/components';
import { ICONS } from '@/config/icons';
import type { FeedbackId } from '@/config/feedbackCatalog';
import { displayId } from '@/utils';
import type { EscalationResolutionAction } from '@/types/lab-operations';
import {
  ForceValidateAction,
  ResolutionPopover,
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

function visibleActions(reasonCode: string | undefined, hasResults: boolean) {
  return {
    showRetest: hasResults && (!reasonCode || reasonCode === 'LIMIT-HIT'),
    showRecollect: !reasonCode || reasonCode === 'LIMIT-HIT',
    showApplyAmendment: reasonCode === 'AMEND-RES' && hasResults,
    showForceValidate:
      hasResults && (reasonCode === 'CRIT-VAL' || reasonCode === 'LIMIT-HIT' || !reasonCode),
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
  resolveAsync,
  onValidationError,
  hasResults = false,
}) => {
  const { showRetest, showRecollect, showApplyAmendment, showForceValidate } = visibleActions(
    reasonCode,
    hasResults,
  );

  return (
    <div className="flex items-center gap-space-2 flex-nowrap">
      {showForceValidate && (
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
      )}

      {showApplyAmendment && (
        <ResolutionPopover
          resolving={resolving}
          triggerLabel="Apply Amendment"
          triggerVariant="approve"
          title="Apply Amendment"
          subtitle={popoverSubtitle(orderTestId, 'Validation notes (optional)')}
          textareaId="escalation-apply-amendment-notes"
          placeholder="e.g. Supervisor approved corrected values"
          value={validationNotesForceValidate}
          onChange={onValidationNotesForceValidateChange}
          confirmLabel="Apply & Validate"
          confirmVariant="success"
          onConfirm={() => resolveAsync('apply_amendment', validationNotesForceValidate)}
        />
      )}

      {showRetest && (
        <ResolutionPopover
          resolving={resolving}
          triggerLabel="Authorize Re-test"
          triggerVariant="secondary"
          triggerIcon={<Icon name={ICONS.actions.loading} />}
          title="Authorize Re-test"
          subtitle={popoverSubtitle(orderTestId, 'Reason (recommended)')}
          textareaId="escalation-authorize-retest-reason"
          placeholder="e.g. One more run with senior tech"
          value={reasonAuthorizeRetest}
          onChange={onReasonAuthorizeRetestChange}
          confirmLabel="Confirm"
          confirmVariant="success"
          onConfirm={() =>
            resolveAsync(
              'authorize_retest',
              reasonAuthorizeRetest || 'Authorized re-test (escalation resolution)',
            )
          }
        />
      )}

      {showRecollect && (
        <ResolutionPopover
          resolving={resolving}
          triggerLabel="Authorize Re-collect"
          triggerVariant="secondary"
          triggerIcon={<Icon name={ICONS.dataFields.sampleCollection} />}
          title="Authorize Re-collect"
          subtitle={popoverSubtitle(orderTestId, 'Reason (required)')}
          textareaId="escalation-authorize-recollect-reason"
          placeholder="e.g. Sample compromised; new collection required"
          value={reasonAuthorizeRecollect}
          onChange={onReasonAuthorizeRecollectChange}
          confirmLabel="Confirm"
          confirmVariant="success"
          disabled={!reasonAuthorizeRecollect.trim()}
          onConfirm={async () => {
            if (!reasonAuthorizeRecollect.trim()) {
              onValidationError('lab.escalation.recollect.reasonRequired');
              return false;
            }
            await resolveAsync('authorize_recollect', reasonAuthorizeRecollect.trim());
          }}
        />
      )}

      <ResolutionPopover
        resolving={resolving}
        triggerLabel="Cancel Test"
        triggerVariant="reject"
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
    </div>
  );
};
