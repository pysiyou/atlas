/**
 * Collection quality issue popover — reports sample problems via unified API.
 * Operator chooses unfinished-test fate when linked unfinished work exists.
 */
import React, { useCallback, useState } from 'react';
import { actionButtonPreset, Button } from '@/components/primitives';
import { LabAnchoredPopover, LabFormPopoverChrome } from '../components/LabActionPopover';
import { displayId } from '@/utils';
import { QualityIssueForm } from '../components/QualityIssueForm';
import { useSubmitQualityIssue } from '../hooks/useSubmitQualityIssue';
import {
  buildSampleRemedyOptions,
  resolveSuggestedRemedy } from '../constants/qualityIssuePopoverCopy';
import type { QualityIssueOptions } from '@/types';
import { useLabCopy } from '@/strings';
import type { RemedyType } from '@/types';

function parseNumericSampleId(sampleId: string): number | undefined {
  return typeof sampleId === 'string' && /^\d+$/.test(sampleId)
    ? parseInt(sampleId, 10)
    : undefined;
}

function useQualityIssueFormState() {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [preferredRemedy, setPreferredRemedy] = useState<RemedyType | ''>('');

  const reset = () => {
    setReason('');
    setNotes('');
    setPreferredRemedy('');
  };

  return { reason, notes, setReason, setNotes, preferredRemedy, setPreferredRemedy, reset };
}

interface CollectionRejectionPopoverContentProps {
  onSuccess: () => void;
  onCancel: () => void;
  sampleId: string;
  accessionNumber?: string | null;
  testCodes: string[];
  sampleType?: string;
  patientName?: string;
  isRecollection?: boolean;
}

function CollectionRejectionPopoverContent({
  onSuccess,
  onCancel,
  sampleId,
  accessionNumber,
  testCodes,
  sampleType,
  patientName,
  isRecollection = false,
}: CollectionRejectionPopoverContentProps) {
  const labCopy = useLabCopy();
  const {
    reason,
    notes,
    setReason,
    setNotes,
    preferredRemedy,
    setPreferredRemedy,
    reset,
  } = useQualityIssueFormState();
  const numericSampleId = parseNumericSampleId(sampleId);
  const { reportIssue, isSubmitting } = useSubmitQualityIssue({ onSuccess });
  const [options, setOptions] = React.useState<QualityIssueOptions | undefined>();

  const unfinishedCount = options?.unfinishedTestsCount ?? 0;
  const requiresUnfinishedChoice = unfinishedCount > 0;
  const suggestedRemedy = resolveSuggestedRemedy(
    options?.suggestedRemedy ?? options?.previewRemedy,
    buildSampleRemedyOptions(options?.allowedRemedies)
  );
  const effectiveRemedy = preferredRemedy || suggestedRemedy;
  const canSubmit = !!reason && (!requiresUnfinishedChoice || effectiveRemedy !== '');

  const handleConfirm = useCallback(async () => {
    if (!numericSampleId || !reason) return;
    if (requiresUnfinishedChoice && !effectiveRemedy) return;
    await reportIssue(
      'sample',
      numericSampleId,
      reason,
      notes,
      effectiveRemedy || undefined
    );
    reset();
    onSuccess();
  }, [
    numericSampleId,
    reason,
    notes,
    effectiveRemedy,
    requiresUnfinishedChoice,
    reportIssue,
    reset,
    onSuccess,
  ]);

  const subtitle = [
    displayId.sample(accessionNumber),
    sampleType,
    patientName,
    isRecollection ? 'Recollection' : null,
    testCodes.length ? `${testCodes.length} test(s)` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <LabFormPopoverChrome
      title={labCopy.quality.reportSampleIssue}
      subtitle={subtitle}
      onCancel={onCancel}
      onConfirm={handleConfirm}
      confirmLabel="Report Issue"
      confirmVariant="danger"
      isSubmitting={isSubmitting}
      disabled={!canSubmit}
    >
      {numericSampleId ? (
        <QualityIssueForm
          targetType="sample"
          targetId={numericSampleId}
          title={labCopy.quality.sampleIssue}
          reason={reason}
          notes={notes}
          preferredRemedy={preferredRemedy}
          onReasonChange={setReason}
          onNotesChange={setNotes}
          onPreferredRemedyChange={setPreferredRemedy}
          isSubmitting={isSubmitting}
          onOptionsLoaded={setOptions}
        />
      ) : null}
    </LabFormPopoverChrome>
  );
}

interface CollectionRejectionPopoverProps {
  sampleId: string;
  accessionNumber?: string | null;
  testCodes: string[];
  sampleType?: string;
  patientName?: string;
  isRecollection?: boolean;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function SampleRejectionPopover({
  sampleId,
  accessionNumber,
  testCodes,
  sampleType,
  patientName,
  isRecollection,
  onSuccess,
  trigger,
}: CollectionRejectionPopoverProps) {
  const labCopy = useLabCopy();
  return (
    <LabAnchoredPopover
      trigger={
        trigger ?? (
          <Button {...actionButtonPreset('reject')} size="sm" title={labCopy.quality.reportSampleIssue}>
            {labCopy.quality.reportSampleIssue}
          </Button>
        )
      }
    >
      {({ close }) => (
        <CollectionRejectionPopoverContent
          sampleId={sampleId}
          accessionNumber={accessionNumber}
          testCodes={testCodes}
          sampleType={sampleType}
          patientName={patientName}
          isRecollection={isRecollection}
          onCancel={close}
          onSuccess={() => {
            onSuccess?.();
            close();
          }}
        />
      )}
    </LabAnchoredPopover>
  );
}
