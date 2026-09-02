/**
 * Collection quality issue popover — reports specimen problems via unified API.
 */
import React, { useCallback } from 'react';
import { Popover, IconButton, FooterInfo } from '@/components';
import { PopoverForm } from '../components/PopoverForm';
import { MODULE_ICONS } from '@/config/icons';
import { displayId } from '@/utils';
import { QualityIssueForm, useQualityIssueFormState } from '../components/QualityIssueForm';
import { useQualityIssueHandler } from '../hooks/useQualityIssueHandler';
import { parseNumericSampleId } from './collectionRejectionPopover.helpers';

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
  const { reason, notes, setReason, setNotes, reset } = useQualityIssueFormState();
  const numericSampleId = parseNumericSampleId(sampleId);
  const { reportIssue, isSubmitting } = useQualityIssueHandler({ onSuccess });

  const handleConfirm = useCallback(async () => {
    if (!numericSampleId || !reason) return;
    await reportIssue('sample', numericSampleId, reason, notes);
    reset();
    onSuccess();
  }, [numericSampleId, reason, notes, reportIssue, reset, onSuccess]);

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
    <PopoverForm
      title="Report Specimen Issue"
      subtitle={subtitle}
      onCancel={onCancel}
      onConfirm={handleConfirm}
      confirmLabel="Report Issue"
      confirmVariant="danger"
      isSubmitting={isSubmitting}
      disabled={!reason}
      footerInfo={<FooterInfo icon={MODULE_ICONS.laboratory} label="Laboratory" />}
    >
      {numericSampleId ? (
        <QualityIssueForm
          targetType="sample"
          targetId={numericSampleId}
          title="Specimen Issue"
          reason={reason}
          notes={notes}
          onReasonChange={setReason}
          onNotesChange={setNotes}
          isSubmitting={isSubmitting}
        />
      ) : null}
    </PopoverForm>
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

export const CollectionRejectionPopover: React.FC<CollectionRejectionPopoverProps> = ({
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
        trigger ?? <IconButton variant="reject" size="sm" title="Report specimen issue" />
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
