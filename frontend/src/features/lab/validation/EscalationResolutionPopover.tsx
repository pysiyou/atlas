import { useEffect, useState } from 'react';
import { Button } from '@/components/primitives';
import { Popover } from '@/components/overlays';
import { cn, displayId } from '@/utils';
import { text, inputBase } from '@/theme/recipes';
import { PopoverFormChrome, RadioCard } from '@/components/overlays';
import type { FeedbackId } from '@/types/generated/feedbackCatalog';
import type { CriticalReadBackPayload, EscalationResolutionAction } from '@/types/lab-operations';
import { RETEST_PATH_RADIO_COPY } from '../constants/qualityIssuePopoverCopy';
import { ResolutionPopover } from './escalationResolutionPopover.chrome';

export { ResolutionPopover } from './escalationResolutionPopover.chrome';

type RetestPath = 'same_sample' | 'recollect';

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
      triggerVariant="success"
      title="Force Validate"
      subtitle={popoverSubtitle(orderTestId, 'Validation notes (optional)')}
      textareaId="escalation-force-validate-notes"
      placeholder="e.g. Supervisor override after review"
      value={validationNotesForceValidate}
      onChange={onValidationNotesForceValidateChange}
      confirmLabel="Force Validate"
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
        <div className="mb-space-3 space-y-space-2">
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
          <label className={`flex items-center gap-space-2 ${text({ role: 'label' })}`}>
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

interface RetestActionProps {
  orderTestId?: number;
  resolving: boolean;
  allowSameSample: boolean;
  allowRecollect: boolean;
  reasonSameSample: string;
  onReasonSameSampleChange: (value: string) => void;
  reasonRecollect: string;
  onReasonRecollectChange: (value: string) => void;
  resolveAsync: (
    action: EscalationResolutionAction,
    reasonOrNotes?: string,
  ) => Promise<void>;
  onValidationError: (id: FeedbackId) => void;
}

export function RetestAction({
  orderTestId,
  resolving,
  allowSameSample,
  allowRecollect,
  reasonSameSample,
  onReasonSameSampleChange,
  reasonRecollect,
  onReasonRecollectChange,
  resolveAsync,
  onValidationError,
}: RetestActionProps) {
  const retestAvailable = allowSameSample || allowRecollect;
  const defaultPath: RetestPath = allowSameSample ? 'same_sample' : 'recollect';

  return (
    <Popover
      placement="top-end"
      offsetValue={8}
      preventClose={resolving}
      trigger={
        <Button
          variant="warning"
          size="sm"
          layout="text"
          disabled={resolving || !retestAvailable}
          isLoading={resolving}
        >
          Retest
        </Button>
      }
    >
      {({ close }) => (
        <RetestActionPopoverBody
          close={close}
          orderTestId={orderTestId}
          resolving={resolving}
          allowSameSample={allowSameSample}
          allowRecollect={allowRecollect}
          defaultPath={defaultPath}
          reasonSameSample={reasonSameSample}
          onReasonSameSampleChange={onReasonSameSampleChange}
          reasonRecollect={reasonRecollect}
          onReasonRecollectChange={onReasonRecollectChange}
          resolveAsync={resolveAsync}
          onValidationError={onValidationError}
        />
      )}
    </Popover>
  );
}

interface RetestActionPopoverBodyProps extends Omit<RetestActionProps, 'allowSameSample' | 'allowRecollect'> {
  close: () => void;
  allowSameSample: boolean;
  allowRecollect: boolean;
  defaultPath: RetestPath;
}

function RetestActionPopoverBody({
  close,
  orderTestId,
  resolving,
  allowSameSample,
  allowRecollect,
  defaultPath,
  reasonSameSample,
  onReasonSameSampleChange,
  reasonRecollect,
  onReasonRecollectChange,
  resolveAsync,
  onValidationError,
}: RetestActionPopoverBodyProps) {
  const [path, setPath] = useState<RetestPath>(defaultPath);

  useEffect(() => {
    setPath(defaultPath);
  }, [defaultPath]);

  const reason = path === 'recollect' ? reasonRecollect : reasonSameSample;
  const onReasonChange = path === 'recollect' ? onReasonRecollectChange : onReasonSameSampleChange;
  const reasonRequired = path === 'recollect';
  const confirmDisabled = reasonRequired && !reason.trim();

  return (
    <div data-popover-content onClick={e => e.stopPropagation()}>
      <PopoverFormChrome
        title="Retest"
        subtitle={popoverSubtitle(
          orderTestId,
          path === 'recollect' ? 'New sample required' : 'Same collected sample',
        )}
        onCancel={close}
        onConfirm={async () => {
          if (path === 'recollect') {
            if (!reasonRecollect.trim()) {
              onValidationError('lab.escalation.recollect.reasonRequired');
              return false;
            }
            await resolveAsync('authorize_recollect', reasonRecollect.trim());
          } else {
            await resolveAsync(
              'authorize_retest',
              reasonSameSample.trim() || 'Authorized re-test (escalation resolution)',
            );
          }
        }}
        confirmLabel="Confirm retest"
        confirmVariant="success"
        isSubmitting={resolving}
        disabled={confirmDisabled}
      >
        <div className="mb-space-3 space-y-space-2">
          {allowSameSample ? (
            <RadioCard
              name="escalation-retest-path"
              selected={path === 'same_sample'}
              onClick={() => setPath('same_sample')}
              label={RETEST_PATH_RADIO_COPY.sameSample.label}
              description={RETEST_PATH_RADIO_COPY.sameSample.description}
            />
          ) : null}
          {allowRecollect ? (
            <RadioCard
              name="escalation-retest-path"
              selected={path === 'recollect'}
              onClick={() => setPath('recollect')}
              label={RETEST_PATH_RADIO_COPY.recollection.label}
              description={RETEST_PATH_RADIO_COPY.recollection.description}
            />
          ) : null}
        </div>
        <div>
          <label className="sr-only" htmlFor="escalation-retest-reason">
            Clinical reason
          </label>
          <textarea
            id="escalation-retest-reason"
            className={cn(inputBase, 'min-h-[80px] resize-none')}
            placeholder={
              reasonRequired
                ? 'e.g. Sample compromised; new collection required'
                : 'e.g. One more run with senior tech (optional)'
            }
            value={reason}
            onChange={e => onReasonChange(e.target.value)}
            maxLength={1000}
          />
        </div>
      </PopoverFormChrome>
    </div>
  );
}
