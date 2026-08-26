/**
 * CollectionRejectionPopover - Popover for rejecting collected samples
 *
 * Allows lab staff to reject samples with reasons, notes, and recollection options.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Popover, IconButton, Alert, Badge, FooterInfo } from '@/components';
import { PopoverForm, CheckboxCard } from '@/features/lab/components/PopoverForm';
import { AttemptProgressBar } from '@/features/lab/components/AttemptProgressBar';
import { POPOVER_FOOTER_MESSAGES } from '@/features/lab/components/popover-footer-constants';
import { cn, displayId } from '@/utils';
import type { RejectionReason } from '@/types';
import { REJECTION_REASON_VALUES, REJECTION_REASON_CONFIG } from '@/types/enums';
import { ICONS } from '@/utils';
import { inputBase } from '@/components/inputs/inputStyles';
import { useSampleRejectionOptions } from '@/features/collection/hooks/useSampleRejectionOptions';

const REJECTION_REASONS = REJECTION_REASON_VALUES.map(value => ({
  value,
  label: REJECTION_REASON_CONFIG[value].label,
  description: REJECTION_REASON_CONFIG[value].description,
}));

interface CollectionRejectionPopoverContentProps {
  onConfirm: (
    reasons: RejectionReason[],
    notes: string,
    requireRecollection: boolean
  ) => void | Promise<void>;
  onCancel: () => void;
  sampleId: string;
  sampleType?: string;
  patientName?: string;
  isRecollection?: boolean;
  rejectionHistoryCount?: number;
  /** When true, confirm button shows loading (e.g. reject mutation in progress) */
  isSubmitting?: boolean;
}

const CollectionRejectionPopoverContent: React.FC<CollectionRejectionPopoverContentProps> = ({
  onConfirm,
  onCancel,
  sampleId,
  sampleType,
  patientName,
  isRecollection = false,
  rejectionHistoryCount = 0,
  isSubmitting: isSubmittingProp,
}) => {
  const [reasons, setReasons] = useState<RejectionReason[]>([]);
  const [notes, setNotes] = useState('');
  const [requireRecollection, setRequireRecollection] = useState(true);
  const [localSubmitting, setLocalSubmitting] = useState(false);

  const numericSampleId =
    typeof sampleId === 'string' && /^\d+$/.test(sampleId) ? parseInt(sampleId, 10) : undefined;
  const { options, isLoading: optionsLoading } = useSampleRejectionOptions({
    sampleId: numericSampleId,
    enabled: Boolean(numericSampleId),
  });

  const rejectionHistoryUsed =
    options?.recollectionAttemptsUsed ?? rejectionHistoryCount;
  const maxAttempts = options?.maxRecollectionAttempts ?? 3;
  const escalationRequired = options?.escalationRequired ?? rejectionHistoryCount >= maxAttempts;
  const canRequireRecollection = options?.canRequireRecollection ?? true;

  const isValid = reasons.length > 0 && (!reasons.includes('other') || notes.trim());
  const isSubmitting = isSubmittingProp ?? localSubmitting;

  const handleConfirm = useCallback(async () => {
    if (!isValid) return;
    setLocalSubmitting(true);
    try {
      await onConfirm(reasons, notes, requireRecollection);
    } finally {
      setLocalSubmitting(false);
    }
  }, [isValid, reasons, notes, requireRecollection, onConfirm]);

  const toggleReason = (value: RejectionReason) => {
    setReasons(prev => (prev.includes(value) ? prev.filter(r => r !== value) : [...prev, value]));
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && isValid) {
        e.preventDefault();
        handleConfirm();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isValid, handleConfirm, onCancel]);

  // Header badges for recollection and rejection history
  const headerBadges = (
    <>
      {isRecollection && (
        <Badge size="sm" variant="warning">
          Recollection
        </Badge>
      )}
      {rejectionHistoryCount > 0 && (
        <Badge size="sm" variant="error">
          {rejectionHistoryCount} Previous Rejection{rejectionHistoryCount > 1 ? 's' : ''}
        </Badge>
      )}
    </>
  );

  // Format sampleId if it's a number or numeric string
  const formattedSampleId =
    typeof sampleId === 'string' && /^\d+$/.test(sampleId)
      ? displayId.sample(parseInt(sampleId, 10))
      : sampleId;

  return (
    <PopoverForm
      title={patientName || 'Reject Sample'}
      subtitle={`${sampleType?.toUpperCase() || 'SAMPLE'} - ${formattedSampleId}`}
      headerBadges={headerBadges}
      onCancel={onCancel}
      onConfirm={handleConfirm}
      confirmLabel="Reject"
      confirmVariant="danger"
      isSubmitting={isSubmitting}
      disabled={!isValid}
      footerInfo={<FooterInfo icon={ICONS.actions.alertCircle} text={POPOVER_FOOTER_MESSAGES.REJECTING_SAMPLE} />}
    >
      {/* Warning Alert */}
      {escalationRequired ? (
        <Alert variant="danger" className="py-2">
          <div className="space-y-0.5">
            <p className="font-normal text-xs">Escalation Required</p>
            <p className="text-xxs opacity-90 leading-tight">
              Maximum recollection attempts reached. Escalate to supervisor before rejecting.
            </p>
          </div>
        </Alert>
      ) : rejectionHistoryUsed > 1 ? (
        <Alert variant="danger" className="py-2">
          <div className="space-y-0.5">
            <p className="font-normal text-xs">Multiple Rejections Detected</p>
            <p className="text-xxs opacity-90 leading-tight">
              This sample has been rejected {rejectionHistoryUsed} times already. Consider
              escalating to supervisor.
            </p>
          </div>
        </Alert>
      ) : (
        <Alert variant="warning" className="py-2">
          <div className="space-y-0.5">
            <p className="font-normal text-xs">Action Required</p>
            <p className="text-xxs opacity-90 leading-tight">
              {patientName
                ? `Sample for ${patientName} will be marked as rejected.`
                : 'The sample will be marked as rejected.'}
            </p>
          </div>
        </Alert>
      )}

      {/* Attempt Progress Bar */}
      {rejectionHistoryUsed > 0 && (
        <div className="space-y-1">
          <label className="block text-xs font-normal text-text-tertiary">
            Rejection History
          </label>
          <AttemptProgressBar
            used={rejectionHistoryUsed}
            total={maxAttempts}
            label="Rejection"
            variant="warning"
          />
          {optionsLoading && (
            <p className="text-xxs text-text-tertiary">Loading attempt limits...</p>
          )}
        </div>
      )}

      {/* Rejection Reasons */}
      <div className="space-y-2">
        <label className="block text-xs font-normal text-text-tertiary">Rejection Reasons</label>
        <div className="border border-border-default rounded-md max-h-[200px] overflow-y-auto">
          {REJECTION_REASONS.map(r => (
            <label
              key={r.value}
              className={`flex items-start p-2 hover:bg-surface-page cursor-pointer border-b border-border-subtle last:border-0 transition-colors ${reasons.includes(r.value) ? 'bg-brand-muted' : ''}`}
            >
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  checked={reasons.includes(r.value)}
                  onChange={() => toggleReason(r.value)}
                  className="h-4 w-4 text-brand border-border-strong rounded focus:ring-brand"
                />
              </div>
              <div className="ml-2 text-xs">
                <div className="font-normal text-text-primary">{r.label}</div>
                <div className="text-text-tertiary">{r.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Recollection Toggle */}
      <div>
        <label className="block text-xs font-normal text-text-tertiary mb-1">Next Step</label>
        <CheckboxCard
          checked={requireRecollection}
          onChange={() => setRequireRecollection(!requireRecollection)}
          label="Require Recollection"
          description="A new pending sample will be automatically created and linked to this rejection."
          disabled={!canRequireRecollection}
        />
        {!canRequireRecollection && options?.requireRecollectionDisabledReason && (
          <p className="text-xs text-warning-fg mt-1">{options.requireRecollectionDisabledReason}</p>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-normal text-text-tertiary mb-1">
          Notes {reasons.includes('other') && <span className="text-danger-fg">*</span>}
        </label>
        <textarea
          rows={2}
          placeholder="Additional details..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          className={cn(inputBase, 'resize-none')}
        />
        {reasons.includes('other') && !notes.trim() && (
          <p className="text-xs text-danger-fg mt-1">Required when "Other" is selected</p>
        )}
      </div>
    </PopoverForm>
  );
};

interface CollectionRejectionPopoverProps {
  /** Sample ID */
  sampleId: string;
  /** Sample type for display */
  sampleType?: string;
  /** Patient name for display */
  patientName?: string;
  /** Whether this is a recollection sample */
  isRecollection?: boolean;
  /** Number of previous rejections */
  rejectionHistoryCount?: number;
  /** Callback when rejection is confirmed */
  onReject: (
    reasons: RejectionReason[],
    notes: string,
    requireRecollection: boolean
  ) => Promise<void> | void;
  /** When true, confirm button shows loading (e.g. reject mutation in progress) */
  isSubmitting?: boolean;
  /** Custom trigger element (uses default icon button if not provided) */
  trigger?: React.ReactNode;
}

export const CollectionRejectionPopover: React.FC<CollectionRejectionPopoverProps> = ({
  sampleId,
  sampleType,
  patientName,
  isRecollection,
  rejectionHistoryCount,
  onReject,
  isSubmitting = false,
  trigger,
}) => (
  <Popover
    placement="bottom-end"
    offsetValue={8}
    preventClose={isSubmitting}
    trigger={trigger || <IconButton variant="delete" size="sm" title="Reject Sample" />}
  >
    {({ close }) => (
      <div data-popover-content onClick={e => e.stopPropagation()}>
        <CollectionRejectionPopoverContent
          sampleId={sampleId}
          sampleType={sampleType}
          patientName={patientName}
          isRecollection={isRecollection}
          rejectionHistoryCount={rejectionHistoryCount}
          onCancel={close}
          isSubmitting={isSubmitting}
          onConfirm={async (reasons, notes, requireRecollection) => {
            await onReject(reasons, notes, requireRecollection);
            close();
          }}
        />
      </div>
    )}
  </Popover>
);
