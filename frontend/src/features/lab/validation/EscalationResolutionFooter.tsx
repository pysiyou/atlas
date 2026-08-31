import React from 'react';
import { ModalFooter } from '../components/LabDetailModal';
import { toast } from '@/app/AppToastBar';
import type { EscalationResolutionAction } from '@/types/lab-operations';
import { EscalationResolutionActions } from './EscalationResolutionActions';

interface EscalationResolutionFooterProps {
  canResolveEscalation: boolean;
  resolving: boolean;
  validationNotesForceValidate: string;
  onValidationNotesForceValidateChange: (value: string) => void;
  reasonAuthorizeRetest: string;
  onReasonAuthorizeRetestChange: (value: string) => void;
  reasonFinalReject: string;
  onReasonFinalRejectChange: (value: string) => void;
  resolveAsync: (action: EscalationResolutionAction, reasonOrNotes?: string) => Promise<void>;
}

export const EscalationResolutionFooter: React.FC<EscalationResolutionFooterProps> = ({
  canResolveEscalation,
  resolving,
  validationNotesForceValidate,
  onValidationNotesForceValidateChange,
  reasonAuthorizeRetest,
  onReasonAuthorizeRetestChange,
  reasonFinalReject,
  onReasonFinalRejectChange,
  resolveAsync,
}) => (
  <ModalFooter statusMessage="" statusClassName="text-text-tertiary">
    {!canResolveEscalation ? (
      <p className="text-sm text-text-tertiary">You do not have permission to resolve escalations.</p>
    ) : (
      <div className="flex items-center gap-3 w-full justify-between">
        <p className="text-xs text-text-tertiary">Choose resolution action:</p>
        <EscalationResolutionActions
          resolving={resolving}
          validationNotesForceValidate={validationNotesForceValidate}
          onValidationNotesForceValidateChange={onValidationNotesForceValidateChange}
          reasonAuthorizeRetest={reasonAuthorizeRetest}
          onReasonAuthorizeRetestChange={onReasonAuthorizeRetestChange}
          reasonFinalReject={reasonFinalReject}
          onReasonFinalRejectChange={onReasonFinalRejectChange}
          resolveAsync={resolveAsync}
          onFinalRejectValidationError={() =>
            toast.error({
              title: 'Please provide a reason for final reject.',
              subtitle:
                'A reason is required when final rejecting. This will request a new sample from the patient.',
            })
          }
        />
      </div>
    )}
  </ModalFooter>
);
