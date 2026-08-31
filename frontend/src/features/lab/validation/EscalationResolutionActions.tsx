import React from 'react';
import { Button, Popover } from '@/components';
import { cn } from '@/utils';
import { inputBase } from '@/components/inputs/inputStyles';
import { PopoverForm } from '@/features/lab/components/PopoverForm';
import type { EscalationResolutionAction } from '@/types/lab-operations';

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

interface EscalationResolutionActionsProps {
  resolving: boolean;
  validationNotesForceValidate: string;
  onValidationNotesForceValidateChange: (value: string) => void;
  reasonAuthorizeRetest: string;
  onReasonAuthorizeRetestChange: (value: string) => void;
  reasonFinalReject: string;
  onReasonFinalRejectChange: (value: string) => void;
  resolveAsync: (action: EscalationResolutionAction, reasonOrNotes?: string) => Promise<void>;
  onFinalRejectValidationError: () => void;
}

export const EscalationResolutionActions: React.FC<EscalationResolutionActionsProps> = ({
  resolving,
  validationNotesForceValidate,
  onValidationNotesForceValidateChange,
  reasonAuthorizeRetest,
  onReasonAuthorizeRetestChange,
  reasonFinalReject,
  onReasonFinalRejectChange,
  resolveAsync,
  onFinalRejectValidationError,
}) => (
  <div className="flex items-center gap-2">
    <ResolutionPopover
      resolving={resolving}
      triggerLabel="Force Validate"
      triggerVariant="approve"
      title="Force Validate"
      subtitle="Validation notes (optional)"
      textareaId="escalation-force-validate-notes"
      placeholder="e.g. Supervisor override after review"
      value={validationNotesForceValidate}
      onChange={onValidationNotesForceValidateChange}
      confirmLabel="Confirm"
      confirmVariant="success"
      onConfirm={() => resolveAsync('force_validate', validationNotesForceValidate)}
    />
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
      triggerLabel="Final Reject / New Sample"
      triggerVariant="reject"
      title="Final Reject / New Sample"
      subtitle="Reason (required)"
      textareaId="escalation-final-reject-reason"
      placeholder="e.g. Sample compromised; request new collection"
      value={reasonFinalReject}
      onChange={onReasonFinalRejectChange}
      confirmLabel="Confirm"
      confirmVariant="danger"
      disabled={!reasonFinalReject.trim()}
      onConfirm={async () => {
        if (!reasonFinalReject.trim()) {
          onFinalRejectValidationError();
          return false;
        }
        await resolveAsync('final_reject', reasonFinalReject.trim());
      }}
    />
  </div>
);
