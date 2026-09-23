/**
 * Collection quality issue popover — reports sample problems via unified API.
 * Operator chooses unfinished-test fate when linked unfinished work exists.
 */
import React, { useCallback, useState } from 'react';
import { actionButtonPreset, Popover, Button, FooterInfo } from '@/components';
import { PopoverFormChrome } from '@/components';
import { MODULE_ICONS } from '@/config/icons';
import { displayId } from '@/utils';
import { QualityIssueForm } from '../components/QualityIssueForm';
import { useSubmitQualityIssue } from '../hooks/useSubmitQualityIssue';
import {
  buildSampleRemedyOptions,
  resolveSuggestedRemedy,
} from '../constants/qualityIssuePopoverCopy';
import type { QualityIssueOptions } from '@/types/lab-operations';
import { LAB_COPY } from '../constants/labConstants';
import type { RemedyType } from '@/types/lab-operations';

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
  testCodes: string[];
  sampleType?: string;
  patientName?: string;
  isRecollection?: boolean;
}

const CollectionRejectionPopoverContent: React.FC<CollectionRejectionPopoverContentProps> = ({
  onSuccess,
  onCancel,
  sampleId,
  testCodes,
  sampleType,
  patientName,
  isRecollection = false,
}) => {
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
    numericSampleId != null ? displayId.sample(numericSampleId) : sampleId,
    sampleType,
    patientName,
    isRecollection ? 'Recollection' : null,
    testCodes.length ? `${testCodes.length} test(s)` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <PopoverFormChrome
      title={LAB_COPY.quality.reportSampleIssue}
      subtitle={subtitle}
      onCancel={onCancel}
      onConfirm={handleConfirm}
      confirmLabel="Report Issue"
      confirmVariant="danger"
      isSubmitting={isSubmitting}
      disabled={!canSubmit}
      footerInfo={<FooterInfo icon={MODULE_ICONS.laboratory} label="Laboratory" />}
    >
      {numericSampleId ? (
        <QualityIssueForm
          targetType="sample"
          targetId={numericSampleId}
          title={LAB_COPY.quality.sampleIssue}
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
    </PopoverFormChrome>
  );
};

interface CollectionRejectionPopoverProps {
  sampleId: string;
  testCodes: string[];
  sampleType?: string;
  patientName?: string;
  isRecollection?: boolean;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export const SampleRejectionPopover: React.FC<CollectionRejectionPopoverProps> = ({
  sampleId,
  testCodes,
  sampleType,
  patientName,
  isRecollection,
  onSuccess,
  trigger,
}) => {
  return (
    <Popover
      placement="bottom-end"
      offsetValue={8}
      preventClose={false}
      trigger={
        trigger ?? (
          <Button {...actionButtonPreset('reject')} size="sm" title={LAB_COPY.quality.reportSampleIssue}>
            {LAB_COPY.quality.reportSampleIssue}
          </Button>
        )
      }
    >
      {({ close }) => (
        <div data-popover-content onClick={e => e.stopPropagation()}>
          <CollectionRejectionPopoverContent
            sampleId={sampleId}
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
        </div>
      )}
    </Popover>
  );
};
