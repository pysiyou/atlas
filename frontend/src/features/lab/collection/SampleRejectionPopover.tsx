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
import { formatDrawVolumeLine, INSUFFICIENT_VOLUME_REJECTION } from '../utils/labSample';

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
  testCodes: string[];
  sampleType?: string;
  patientName?: string;
  isRecollection?: boolean;
  requiredVolumeMl?: number;
  targetVolumeMl?: number;
  qualityIssues?: string[] | null;
}

function CollectionRejectionPopoverContent({
  onSuccess,
  onCancel,
  sampleId,
  testCodes,
  sampleType,
  patientName,
  isRecollection = false,
  requiredVolumeMl = 0,
  targetVolumeMl = 0,
  qualityIssues,
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
  const { reportIssue, isSubmitting } = useSubmitQualityIssue({ onSuccess });
  const [options, setOptions] = React.useState<QualityIssueOptions | undefined>();
  const volumeReferenceLine = formatDrawVolumeLine(requiredVolumeMl, targetVolumeMl);

  React.useEffect(() => {
    if (qualityIssues?.includes(INSUFFICIENT_VOLUME_REJECTION)) {
      setReason(INSUFFICIENT_VOLUME_REJECTION);
    }
  }, [qualityIssues, setReason]);

  const unfinishedCount = options?.unfinishedTestsCount ?? 0;
  const requiresUnfinishedChoice = unfinishedCount > 0;
  const suggestedRemedy = resolveSuggestedRemedy(
    options?.suggestedRemedy,
    buildSampleRemedyOptions(options?.allowedRemedies)
  );
  const effectiveRemedy = preferredRemedy || suggestedRemedy;
  const canSubmit = !!reason && (!requiresUnfinishedChoice || effectiveRemedy !== '');

  const handleConfirm = useCallback(async () => {
    if (!sampleId || !reason) return;
    if (requiresUnfinishedChoice && !effectiveRemedy) return;
    await reportIssue(
      'sample',
      sampleId,
      reason,
      notes,
      effectiveRemedy || undefined
    );
    reset();
    onSuccess();
  }, [
    sampleId,
    reason,
    notes,
    effectiveRemedy,
    requiresUnfinishedChoice,
    reportIssue,
    reset,
    onSuccess,
  ]);

  const subtitle = [
    displayId.sample(sampleId),
    sampleType,
    patientName,
    isRecollection ? 'Recollection' : null,
    testCodes.length ? `${testCodes.length} test(s)` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <LabFormPopoverChrome
      title={labCopy.quality.rejectSamplePopover}
      subtitle={subtitle}
      onCancel={onCancel}
      onConfirm={handleConfirm}
      confirmLabel="Report Issue"
      confirmVariant="danger"
      isSubmitting={isSubmitting}
      disabled={!canSubmit}
    >
      {sampleId ? (
        <QualityIssueForm
          targetType="sample"
          targetId={sampleId}
          title={labCopy.quality.sampleIssue}
          reason={reason}
          notes={notes}
          preferredRemedy={preferredRemedy}
          onReasonChange={setReason}
          onNotesChange={setNotes}
          onPreferredRemedyChange={setPreferredRemedy}
          isSubmitting={isSubmitting}
          onOptionsLoaded={setOptions}
          volumeReferenceLine={volumeReferenceLine}
        />
      ) : null}
    </LabFormPopoverChrome>
  );
}

interface CollectionRejectionPopoverProps {
  sampleId: string;
  testCodes: string[];
  sampleType?: string;
  patientName?: string;
  isRecollection?: boolean;
  requiredVolumeMl?: number;
  targetVolumeMl?: number;
  qualityIssues?: string[] | null;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function SampleRejectionPopover({
  sampleId,
  testCodes,
  sampleType,
  patientName,
  isRecollection,
  requiredVolumeMl,
  targetVolumeMl,
  qualityIssues,
  onSuccess,
  trigger,
}: CollectionRejectionPopoverProps) {
  const labCopy = useLabCopy();
  return (
    <LabAnchoredPopover
      trigger={
        trigger ?? (
          <Button {...actionButtonPreset('reject')} size="sm" title={labCopy.quality.rejectSample}>
            {labCopy.quality.rejectSample}
          </Button>
        )
      }
    >
      {({ close }) => (
        <CollectionRejectionPopoverContent
          sampleId={sampleId}
          testCodes={testCodes}
          sampleType={sampleType}
          patientName={patientName}
          isRecollection={isRecollection}
          requiredVolumeMl={requiredVolumeMl}
          targetVolumeMl={targetVolumeMl}
          qualityIssues={qualityIssues}
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
