import type { ReactNode } from 'react';
import { Button, Popover } from '@/components';
import { cn, displayId } from '@/utils';
import { inputBase } from '@/components/inputs/inputStyles';
import { LabWorkflowPopoverChrome } from '../components/LabWorkflowPopoverChrome';
import type { FeedbackId } from '@/config/feedbackCatalog';
import type { CriticalReadBackPayload, EscalationResolutionAction } from '@/types/lab-operations';
import { TYPE } from '@/components/theme/recipes';


interface ResolutionPopoverProps {
  resolving: boolean;
  triggerLabel: string;
  triggerVariant: 'approve' | 'secondary' | 'reject';
  triggerIcon?: ReactNode;
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

export function ResolutionPopover({
  resolving,
  triggerLabel,
  triggerVariant,
  triggerIcon,
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
        <Button
          variant={triggerVariant}
          size="md"
          layout="icon-text"
          icon={triggerIcon}
          disabled={resolving}
          isLoading={resolving}
        >
          {triggerLabel}
        </Button>
      }
    >
      {({ close }) => (
        <div data-popover-content onClick={e => e.stopPropagation()}>
          <LabWorkflowPopoverChrome
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
          </LabWorkflowPopoverChrome>
        </div>
      )}
    </Popover>
  );
}

function popoverSubtitle(orderTestId?: number, hint?: string): string {
  const label = orderTestId != null ? displayId.orderTest(orderTestId) : undefined;
  return [label, hint].filter(Boolean).join(' · ');
}

interface ForceValidateActionProps {
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
  resolveAsync: (
    action: EscalationResolutionAction,
    reasonOrNotes?: string,
    options?: { readBack?: CriticalReadBackPayload },
  ) => Promise<void>;
  onValidationError: (id: FeedbackId) => void;
}

export function ForceValidateAction({
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
  resolveAsync,
  onValidationError,
}: ForceValidateActionProps) {
  return (
    <ResolutionPopover
      resolving={resolving}
      triggerLabel="Force Validate"
      triggerVariant="approve"
      title="Force Validate"
      subtitle={popoverSubtitle(orderTestId, 'Validation notes (optional)')}
      textareaId="escalation-force-validate-notes"
      placeholder="e.g. Supervisor override after review"
      value={validationNotesForceValidate}
      onChange={onValidationNotesForceValidateChange}
      confirmLabel="Confirm"
      confirmVariant="success"
      disabled={
        requiresReadBack &&
        (!readBackConfirmed || !readBackProviderName.trim() || !readBackProviderContact.trim())
      }
      onConfirm={async () => {
        if (requiresReadBack) {
          if (!readBackProviderName.trim() || !readBackProviderContact.trim()) {
            onValidationError('lab.escalation.readBack.providerRequired');
            return false;
          }
          if (!readBackConfirmed) {
            onValidationError('lab.escalation.readBack.confirmRequired');
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
          <label className={`flex items-center gap-2 ${TYPE.label}`}>
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
  );
}
