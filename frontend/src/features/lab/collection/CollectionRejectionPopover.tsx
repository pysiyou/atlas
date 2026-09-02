/**
 * CollectionRejectionPopover - Popover for rejecting collected samples
 *
 * Allows lab staff to reject samples with catalog-defined reasons and optional notes.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Popover, IconButton, FooterInfo } from '@/components';
import { PopoverForm } from '../components/PopoverForm';
import { MODULE_ICONS } from '@/config/icons';
import { displayId } from '@/utils';
import { useTestCatalog } from '@/features/catalog';
import { getUnionRejectionCriteria } from '@/features/lab/utils/catalogRejectionCriteria';
import { LAB_CONFIG } from '@/features/lab/constants';
import { useSampleRejectionOptions } from '@/features/lab/collection/useSampleRejectionOptions';
import {
  isRejectionFormValid,
  parseNumericSampleId,
} from './collectionRejectionPopover.helpers';
import {
  RecollectionToggleSection,
  RejectionHeaderBadges,
  RejectionHistorySection,
  CatalogRejectionReasonSection,
  RejectionWarningAlert,
} from './CollectionRejectionPopoverSections';

interface CollectionRejectionPopoverContentProps {
  onConfirm: (
    rejectionReason: string,
    notes: string,
    requireRecollection: boolean
  ) => void | Promise<void>;
  onCancel: () => void;
  sampleId: string;
  testCodes: string[];
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
  testCodes,
  sampleType,
  patientName,
  isRecollection = false,
  rejectionHistoryCount = 0,
  isSubmitting: isSubmittingProp,
}) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [notes, setNotes] = useState('');
  const [requireRecollection, setRequireRecollection] = useState(true);
  const [localSubmitting, setLocalSubmitting] = useState(false);

  const { tests: catalog = [], isLoading: catalogLoading } = useTestCatalog();
  const numericSampleId = parseNumericSampleId(sampleId);
  const { options, isLoading: optionsLoading } = useSampleRejectionOptions({
    sampleId: numericSampleId,
    enabled: Boolean(numericSampleId),
  });

  const canRequireRecollection = options?.canRequireRecollection ?? true;

  // When recollection limit is reached, force reject-only (PATCH /reject, not reject-and-recollect).
  useEffect(() => {
    if (!canRequireRecollection) {
      setRequireRecollection(false);
    }
  }, [canRequireRecollection]);

  const criteria = useMemo(() => {
    if (options?.allowedRejectionCriteria?.length) {
      return options.allowedRejectionCriteria;
    }
    return getUnionRejectionCriteria(testCodes, catalog);
  }, [options?.allowedRejectionCriteria, testCodes, catalog]);

  const rejectionHistoryUsed =
    options?.recollectionAttemptsUsed ?? rejectionHistoryCount;
  const maxAttempts = options?.maxRecollectionAttempts ?? LAB_CONFIG.MAX_RECOLLECTION_ATTEMPTS;
  const escalationRequired = options?.escalationRequired ?? rejectionHistoryCount >= maxAttempts;
  const suspendedTestsCount = options?.suspendedTestsCount ?? 0;
  const completedTestsCount =
    options?.completedTestsCount ??
    (options?.validatedTestsCount ?? (options?.orderHasValidatedTests ? 1 : 0));
  const criteriaLoading = catalogLoading || optionsLoading;

  const isValid = isRejectionFormValid(rejectionReason, criteria);
  const isSubmitting = isSubmittingProp ?? localSubmitting;

  const handleConfirm = useCallback(async () => {
    if (!isValid) return;
    const willRecollect = requireRecollection && canRequireRecollection;
    setLocalSubmitting(true);
    try {
      await onConfirm(rejectionReason, notes, willRecollect);
    } finally {
      setLocalSubmitting(false);
    }
  }, [isValid, rejectionReason, notes, requireRecollection, canRequireRecollection, onConfirm]);

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
      subtitle={`${sampleType?.toUpperCase() || 'SAMPLE'} - ${(() => {
        const numericId = parseNumericSampleId(sampleId);
        return numericId != null ? displayId.sample(numericId) : sampleId;
      })()}`}
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
      footerInfo={<FooterInfo icon={MODULE_ICONS.laboratory} label="Laboratory" />}
    >
      <RejectionWarningAlert
        escalationRequired={escalationRequired}
        rejectionHistoryUsed={rejectionHistoryUsed}
        patientName={patientName}
        suspendedTestsCount={suspendedTestsCount}
        completedTestsCount={completedTestsCount}
      />

      <RejectionHistorySection
        rejectionHistoryUsed={rejectionHistoryUsed}
        maxAttempts={maxAttempts}
        optionsLoading={optionsLoading}
      />

      <CatalogRejectionReasonSection
        criteria={criteria}
        criteriaLoading={criteriaLoading}
        rejectionReason={rejectionReason}
        rejectionNotes={notes}
        onReasonChange={setRejectionReason}
        onNotesChange={setNotes}
      />

      <RecollectionToggleSection
        requireRecollection={requireRecollection}
        canRequireRecollection={canRequireRecollection}
        disabledReason={options?.requireRecollectionDisabledReason}
        onToggle={() => setRequireRecollection(!requireRecollection)}
      />
    </PopoverForm>
  );
};

interface CollectionRejectionPopoverProps {
  /** Sample ID */
  sampleId: string;
  /** Test codes linked to this sample (for catalog criteria lookup) */
  testCodes: string[];
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
    rejectionReason: string,
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
  testCodes,
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
          testCodes={testCodes}
          sampleType={sampleType}
          patientName={patientName}
          isRecollection={isRecollection}
          rejectionHistoryCount={rejectionHistoryCount}
          onCancel={close}
          isSubmitting={isSubmitting}
          onConfirm={async (rejectionReason, notes, requireRecollection) => {
            try {
              await onReject(rejectionReason, notes, requireRecollection);
              close();
            } catch {
              // Error toast handled by useRejectSampleHandler; keep popover open for retry.
            }
          }}
        />
      </div>
    )}
  </Popover>
);
