/**
 * CollectionRejectionPopover - Popover for rejecting collected samples
 *
 * Allows lab staff to reject samples with reasons, notes, and recollection options.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Popover, IconButton, FooterInfo } from '@/components';
import { PopoverForm } from '@/features/lab/components/PopoverForm';
import { POPOVER_FOOTER_MESSAGES } from '@/features/lab/components/popoverFooterConstants';
import type { RejectionReason } from '@/types';
import { ICONS } from '@/utils';
import { useSampleRejectionOptions } from '@/features/collection/hooks/useSampleRejectionOptions';
import {
  formatSampleId,
  isRejectionFormValid,
  parseNumericSampleId,
  toggleRejectionReason,
} from '../utils/collectionRejectionPopoverHelpers';
import {
  RecollectionToggleSection,
  RejectionHeaderBadges,
  RejectionHistorySection,
  RejectionNotesSection,
  RejectionReasonsSection,
  RejectionWarningAlert,
} from './CollectionRejectionPopoverSections';

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

  const numericSampleId = parseNumericSampleId(sampleId);
  const { options, isLoading: optionsLoading } = useSampleRejectionOptions({
    sampleId: numericSampleId,
    enabled: Boolean(numericSampleId),
  });

  const rejectionHistoryUsed =
    options?.recollectionAttemptsUsed ?? rejectionHistoryCount;
  const maxAttempts = options?.maxRecollectionAttempts ?? 3;
  const escalationRequired = options?.escalationRequired ?? rejectionHistoryCount >= maxAttempts;
  const canRequireRecollection = options?.canRequireRecollection ?? true;

  const isValid = isRejectionFormValid(reasons, notes);
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

  const handleToggleReason = (value: RejectionReason) => {
    setReasons(prev => toggleRejectionReason(prev, value));
  };

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

  return (
    <PopoverForm
      title={patientName || 'Reject Sample'}
      subtitle={`${sampleType?.toUpperCase() || 'SAMPLE'} - ${formatSampleId(sampleId)}`}
      headerBadges={
        <RejectionHeaderBadges
          isRecollection={isRecollection}
          rejectionHistoryCount={rejectionHistoryCount}
        />
      }
      onCancel={onCancel}
      onConfirm={handleConfirm}
      confirmLabel="Reject"
      confirmVariant="danger"
      isSubmitting={isSubmitting}
      disabled={!isValid}
      footerInfo={<FooterInfo icon={ICONS.actions.alertCircle} text={POPOVER_FOOTER_MESSAGES.REJECTING_SAMPLE} />}
    >
      <RejectionWarningAlert
        escalationRequired={escalationRequired}
        rejectionHistoryUsed={rejectionHistoryUsed}
        patientName={patientName}
      />

      <RejectionHistorySection
        rejectionHistoryUsed={rejectionHistoryUsed}
        maxAttempts={maxAttempts}
        optionsLoading={optionsLoading}
      />

      <RejectionReasonsSection reasons={reasons} onToggleReason={handleToggleReason} />

      <RecollectionToggleSection
        requireRecollection={requireRecollection}
        canRequireRecollection={canRequireRecollection}
        disabledReason={options?.requireRecollectionDisabledReason}
        onToggle={() => setRequireRecollection(!requireRecollection)}
      />

      <RejectionNotesSection reasons={reasons} notes={notes} onNotesChange={setNotes} />
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
    trigger={trigger || <IconButton variant="reject" size="sm" title="Reject Sample" />}
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
