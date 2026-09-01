import React from 'react';
import { Button, Popover } from '@/components';
import { cn } from '@/utils';
import { inputBase } from '@/components/inputs/inputStyles';
import { PopoverForm } from '../components/PopoverForm';
import type { CriticalReadBackPayload, EscalationResolutionAction } from '@/types/lab-operations';

interface ResolutionPopoverProps {
  resolving: boolean;
  triggerLabel: string;
  triggerVariant: 'approve' | 'secondary' | 'reject';
  title: string;
  subtitle: string;
  textareaId: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  confirmLabel: string;
  confirmVariant: 'success' | 'danger';
  disabled?: boolean;
  onConfirm: () => Promise<void | boolean>;
  children?: React.ReactNode;
}

function ResolutionPopover({
  resolving,
  triggerLabel,
  triggerVariant,
  title,
  subtitle,
  textareaId,
  placeholder,
  value,
  onChange,
  confirmLabel,
  confirmVariant,
  disabled,
  onConfirm,
  children,
}: ResolutionPopoverProps) {
  return (
    <Popover
      placement="top-end"
      offsetValue={8}
      preventClose={resolving}
      trigger={
        <Button variant={triggerVariant} size="md" disabled={resolving} isLoading={resolving}>
          {triggerLabel}
        </Button>
      }
    >
      {({ close }) => (
        <div data-popover-content onClick={e => e.stopPropagation()}>
          <PopoverForm
            title={title}
            subtitle={subtitle}
            onCancel={close}
            onConfirm={async () => {
              const shouldClose = await onConfirm();
              if (shouldClose !== false) close();
            }}
            confirmLabel={confirmLabel}
            confirmVariant={confirmVariant}
            isSubmitting={resolving}
            disabled={disabled}
          >
            {children}
            <div>
              <label className="sr-only" htmlFor={textareaId}>
                {subtitle}
              </label>
              <textarea
                id={textareaId}
                className={cn(inputBase, 'min-h-[80px] resize-none')}
                placeholder={placeholder}
                value={value}
                onChange={e => onChange(e.target.value)}
                maxLength={1000}
              />
            </div>
          </PopoverForm>
        </div>
      )}
    </Popover>
  );
}

export interface EscalationResolveOptions {
  readBack?: CriticalReadBackPayload;
}

interface EscalationResolutionActionsProps {
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
  onValidationError: (message: string, subtitle: string) => void;
}

export const EscalationResolutionActions: React.FC<EscalationResolutionActionsProps> = ({
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
  resolveAsync,
  onValidationError,
}) => (
  <div className="flex flex-wrap items-center gap-2">
    <ResolutionPopover
      resolving={resolving}
      triggerLabel="Force Validate"
      triggerVariant="approve"
      title="Force Validate"
      subtitle={requiresReadBack ? 'Validation notes (optional)' : 'Validation notes (optional)'}
      textareaId="escalation-force-validate-notes"
      placeholder="e.g. Supervisor override after review"
      value={validationNotesForceValidate}
      onChange={onValidationNotesForceValidateChange}
      confirmLabel="Confirm"
      confirmVariant="success"
      disabled={requiresReadBack && (!readBackConfirmed || !readBackProviderName.trim() || !readBackProviderContact.trim())}
      onConfirm={async () => {
        if (requiresReadBack) {
          if (!readBackProviderName.trim() || !readBackProviderContact.trim()) {
            onValidationError(
              'Provider read-back required',
              'Enter provider name and contact for critical value release.'
            );
            return false;
          }
          if (!readBackConfirmed) {
            onValidationError(
              'Read-back confirmation required',
              'Confirm provider read-back before force-validating critical results.'
            );
            return false;
          }
        }
        await resolveAsync('force_validate', validationNotesForceValidate, {
          readBack: requiresReadBack
            ? {
                providerName: readBackProviderName.trim(),
                providerContact: readBackProviderContact.trim(),
                notifiedAt: new Date().toISOString(),
                readBackConfirmed: true,
              }
            : undefined,
        });
      }}
    >
      {requiresReadBack && (
        <div className="mb-3 space-y-2">
          <input
            className={cn(inputBase, 'w-full')}
            placeholder="Provider name"
            value={readBackProviderName}
            onChange={e => onReadBackProviderNameChange(e.target.value)}
          />
          <input
            className={cn(inputBase, 'w-full')}
            placeholder="Provider contact"
            value={readBackProviderContact}
            onChange={e => onReadBackProviderContactChange(e.target.value)}
          />
          <label className="flex items-center gap-2 text-xs text-text-secondary">
            <input
              type="checkbox"
              checked={readBackConfirmed}
              onChange={e => onReadBackConfirmedChange(e.target.checked)}
            />
            Read-back confirmed with ordering provider
          </label>
        </div>
      )}
    </ResolutionPopover>
    <ResolutionPopover
      resolving={resolving}
      triggerLabel="Authorize Re-test"
      triggerVariant="secondary"
      title="Authorize Re-test"
      subtitle="Reason (recommended)"
      textareaId="escalation-authorize-retest-reason"
      placeholder="e.g. One more run with senior tech"
      value={reasonAuthorizeRetest}
      onChange={onReasonAuthorizeRetestChange}
      confirmLabel="Confirm"
      confirmVariant="success"
      onConfirm={() =>
        resolveAsync(
          'authorize_retest',
          reasonAuthorizeRetest || 'Authorized re-test (escalation resolution)'
        )
      }
    />
    <ResolutionPopover
      resolving={resolving}
      triggerLabel="Authorize Re-collect"
      triggerVariant="secondary"
      title="Authorize Re-collect"
      subtitle="Reason (required)"
      textareaId="escalation-authorize-recollect-reason"
      placeholder="e.g. Sample compromised; new collection required"
      value={reasonAuthorizeRecollect}
      onChange={onReasonAuthorizeRecollectChange}
      confirmLabel="Confirm"
      confirmVariant="success"
      disabled={!reasonAuthorizeRecollect.trim()}
      onConfirm={async () => {
        if (!reasonAuthorizeRecollect.trim()) {
          onValidationError(
            'Reason required',
            'Provide a clinical reason to authorize re-collection.'
          );
          return false;
        }
        await resolveAsync('authorize_recollect', reasonAuthorizeRecollect.trim());
      }}
    />
    <ResolutionPopover
      resolving={resolving}
      triggerLabel="Cancel Test"
      triggerVariant="reject"
      title="Cancel Test"
      subtitle="Clinical reason (required)"
      textareaId="escalation-final-reject-reason"
      placeholder="e.g. Test no longer clinically indicated"
      value={reasonFinalReject}
      onChange={onReasonFinalRejectChange}
      confirmLabel="Confirm Cancel"
      confirmVariant="danger"
      disabled={!reasonFinalReject.trim()}
      onConfirm={async () => {
        if (!reasonFinalReject.trim()) {
          onValidationError('Reason required', 'Provide a clinical reason to cancel this test.');
          return false;
        }
        await resolveAsync('final_reject', reasonFinalReject.trim());
      }}
    />
  </div>
);
