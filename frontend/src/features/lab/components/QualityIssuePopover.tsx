/**
 * QualityIssuePopover - Popover for reporting quality issues on test results.
 * Validator chooses reason + destination (retest / recollect / cancel).
 */

import React, { useState } from 'react';
import { TYPE } from '@/components/theme/recipes';
import { actionButtonPreset, Popover, Button, Alert, FooterInfo, PopoverFormChrome } from '@/components';
import { MODULE_ICONS } from '@/config/icons';
import { useQualityIssuePopover } from '../hooks/useQualityIssuePopover';
import type { QualityIssueResult, RemedyType } from '@/types/lab-operations';
import {
  QUALITY_ISSUE_POPOVER_LAYOUT,
  QUALITY_ISSUE_POPOVER_COPY,
  type ValidationFormCopy,
} from '../constants/qualityIssuePopoverCopy';
import { CatalogRejectionCriteriaFields } from './CatalogRejectionCriteriaFields';
import { QualityIssuePopoverLoadingView, QualityIssuePopoverErrorView } from './QualityIssuePopoverStates';
import {
  QualityIssueRemedyPicker,
  type RemedyOption,
} from './QualityIssueRemedyPicker';

/** Re-export views for consumers that render them directly */
export { QualityIssuePopoverLoadingView, QualityIssuePopoverErrorView } from './QualityIssuePopoverStates';

/** Grouped state for form body (readability and future prop additions). */
export interface QualityIssuePopoverState {
  error: string | null;
  escalationRequired: boolean;
  formCopy: ValidationFormCopy | null;
  rejectionReason: string;
  rejectionNotes: string;
  allowedCriteria: string[];
  criteriaLoading: boolean;
  preferredRemedy: RemedyType | '';
  remedyOptions: RemedyOption[];
}

/** Grouped actions for form body. */
export interface QualityIssueFormActions {
  onReasonChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onRemedyChange: (value: RemedyType) => void;
}

interface QualityIssuePopoverFormBodyProps {
  state: QualityIssuePopoverState;
  actions: QualityIssueFormActions;
}

export const QualityIssuePopoverFormBody: React.FC<QualityIssuePopoverFormBodyProps> = ({
  state,
  actions,
}) => {
  const {
    error,
    formCopy,
    rejectionReason,
    rejectionNotes,
    allowedCriteria,
    criteriaLoading,
    preferredRemedy,
    remedyOptions,
  } = state;
  const { onReasonChange, onNotesChange, onRemedyChange } = actions;
  const copy =
    formCopy ?? {
      alert: null,
      confirmLabel: QUALITY_ISSUE_POPOVER_COPY.reject.confirmLabel,
      reasonLabel: QUALITY_ISSUE_POPOVER_COPY.reject.reasonLabel,
      notesLabel: QUALITY_ISSUE_POPOVER_COPY.reject.notesLabel,
      escalationRequired: false,
    };

  return (
    <>
      {error && (
        <Alert variant="danger" className="py-space-2">
          <p className={TYPE.value}>{error}</p>
        </Alert>
      )}

      {copy.alert && (
        <Alert
          variant={copy.alert.variant}
          title={copy.alert.title}
          description={copy.alert.description}
          className="py-space-3"
        />
      )}

      <CatalogRejectionCriteriaFields
        criteria={allowedCriteria}
        criteriaLoading={criteriaLoading}
        rejectionReason={rejectionReason}
        rejectionNotes={rejectionNotes}
        onReasonChange={onReasonChange}
        onNotesChange={onNotesChange}
        reasonLabel={copy.reasonLabel}
        showNotes={false}
      />

      <QualityIssueRemedyPicker
        options={remedyOptions}
        value={preferredRemedy}
        onChange={onRemedyChange}
      />

      <CatalogRejectionCriteriaFields
        criteria={allowedCriteria}
        rejectionReason={rejectionReason}
        rejectionNotes={rejectionNotes}
        onReasonChange={onReasonChange}
        onNotesChange={onNotesChange}
        notesLabel={copy.notesLabel}
        notesRows={QUALITY_ISSUE_POPOVER_LAYOUT.reasonTextareaRows}
        showReason={false}
      />
    </>
  );
};

interface QualityIssuePopoverContentProps {
  orderTestId: number;
  testName?: string;
  testCode?: string;
  patientName?: string;
  onConfirm: (result: QualityIssueResult) => void;
  onCancel: () => void;
  onSubmittingChange?: (submitting: boolean) => void;
}

const QualityIssuePopoverContent: React.FC<QualityIssuePopoverContentProps> = ({
  orderTestId,
  testName,
  testCode,
  patientName,
  onConfirm,
  onCancel,
  onSubmittingChange,
}) => {
  const {
    rejectionReason,
    setRejectionReason,
    rejectionNotes,
    setRejectionNotes,
    preferredRemedy,
    setPreferredRemedy,
    remedyOptions,
    isConfirmDisabled,
    isLoading,
    isRejecting,
    error,
    options,
    formCopy,
    handleConfirm,
    handleRetry,
    subtitle,
    copy,
  } = useQualityIssuePopover({
    orderTestId,
    testName,
    testCode,
    patientName,
    onConfirm,
    onCancel,
    onSubmittingChange,
  });

  if (isLoading) return <QualityIssuePopoverLoadingView />;
  if (error && !options) {
    return <QualityIssuePopoverErrorView error={error} onRetry={handleRetry} onCancel={onCancel} />;
  }

  return (
    <PopoverFormChrome
      title={copy.title}
      subtitle={subtitle || undefined}
      onCancel={onCancel}
      onConfirm={handleConfirm}
      confirmLabel={copy.confirmLabel}
      confirmVariant="danger"
      isSubmitting={isRejecting}
      disabled={isConfirmDisabled}
      footerInfo={<FooterInfo icon={MODULE_ICONS.laboratory} label="Laboratory" />}
    >
      <QualityIssuePopoverFormBody
        state={{
          error,
          escalationRequired: formCopy?.escalationRequired ?? false,
          formCopy,
          rejectionReason,
          rejectionNotes,
          allowedCriteria: options?.allowedCriteria ?? [],
          criteriaLoading: isLoading,
          preferredRemedy,
          remedyOptions,
        }}
        actions={{
          onReasonChange: setRejectionReason,
          onNotesChange: setRejectionNotes,
          onRemedyChange: setPreferredRemedy,
        }}
      />
    </PopoverFormChrome>
  );
};

interface QualityIssuePopoverProps {
  orderTestId: number;
  testCode?: string;
  testName?: string;
  patientName?: string;
  onReject: (result: QualityIssueResult) => void;
  trigger?: React.ReactNode;
}

export const QualityIssuePopover: React.FC<QualityIssuePopoverProps> = ({
  orderTestId,
  testCode,
  testName,
  patientName,
  onReject,
  trigger,
}) => {
  const [effectiveSubmitting, setEffectiveSubmitting] = useState(false);

  return (
    <Popover
      placement="bottom-end"
      offsetValue={QUALITY_ISSUE_POPOVER_LAYOUT.popoverOffset}
      preventClose={effectiveSubmitting}
      trigger={
        trigger ?? (
          <Button {...actionButtonPreset('reject')} size="sm" title={QUALITY_ISSUE_POPOVER_COPY.triggerTitle}>
            {QUALITY_ISSUE_POPOVER_COPY.triggerTitle}
          </Button>
        )
      }
    >
      {({ close }) => (
        <div data-popover-content onClick={e => e.stopPropagation()}>
          <QualityIssuePopoverContent
            orderTestId={orderTestId}
            testCode={testCode}
            testName={testName}
            patientName={patientName}
            onSubmittingChange={setEffectiveSubmitting}
            onConfirm={result => {
              onReject(result);
              close();
            }}
            onCancel={close}
          />
        </div>
      )}
    </Popover>
  );
};
