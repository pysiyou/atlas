/**
 * Collection quality issue popover — reports sample problems via unified API.
 * Operator chooses unfinished-test fate when linked unfinished work exists.
 */
import React, { useCallback } from 'react';
import { Popover, Button, FooterInfo } from '@/components';
import { LabWorkflowPopoverChrome } from '../components/LabWorkflowPopoverChrome';
import { MODULE_ICONS } from '@/config/icons';
import { displayId } from '@/utils';
import { QualityIssueForm } from '../components/QualityIssueForm';
import { useQualityIssueFormState } from '../hooks/useQualityIssueFormState';
import { useSubmitQualityIssue } from '../hooks/useSubmitQualityIssue';
import { useQualityIssueOptions } from '../api/qualityIssues.api';
import {
  buildSampleRemedyOptions,
  resolveSuggestedRemedy,
} from '../components/remedyDestinationUtils';
import { parseNumericSampleId } from './sampleRejectionPopover.helpers';
import { LAB_COPY } from '../constants/labCopy';

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
  const { data: options } = useQualityIssueOptions(
    numericSampleId ? 'sample' : undefined,
    numericSampleId ?? undefined,
  );

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
    <LabWorkflowPopoverChrome
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
        />
      ) : null}
    </LabWorkflowPopoverChrome>
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
          <Button variant="reject" size="sm" title={LAB_COPY.quality.reportSampleIssue}>
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
