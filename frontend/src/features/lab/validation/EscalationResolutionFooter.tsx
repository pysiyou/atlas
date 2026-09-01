import React from 'react';
import { ModalFooter } from '../components/LabDetailModal';
import { toast } from '@/app/AppToastBar';
import type { EscalationResolutionAction } from '@/types/lab-operations';
import {
  EscalationResolutionActions,
  type EscalationResolveOptions,
} from './EscalationResolutionActions';

interface EscalationResolutionFooterProps {
  canResolveEscalation: boolean;
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
  resolveAsync: (
    action: EscalationResolutionAction,
    reasonOrNotes?: string,
    options?: EscalationResolveOptions
  ) => Promise<void>;
}

export const EscalationResolutionFooter: React.FC<EscalationResolutionFooterProps> = props => {
  const { canResolveEscalation, resolving, ...actionProps } = props;

  return (
    <ModalFooter statusMessage="" statusClassName="text-text-tertiary">
      {!canResolveEscalation ? (
        <p className="text-sm text-text-tertiary">You do not have permission to resolve escalations.</p>
      ) : (
        <div className="flex items-center gap-3 w-full justify-between">
          <p className="text-xs text-text-tertiary">Choose resolution action:</p>
          <EscalationResolutionActions
            {...actionProps}
            resolving={resolving}
            onValidationError={(title, subtitle) => toast.error({ title, subtitle })}
          />
        </div>
      )}
    </ModalFooter>
  );
};
