/**
 * QualityIssueDialog - Popover for reporting quality issues on test results.
 * Validator chooses reason + destination (retest / recollect / cancel / escalate).
 */

import React, { useState } from 'react';
import { Popover, Button, Alert, FooterInfo } from '@/components';
import { PopoverForm } from './PopoverForm';
import { MODULE_ICONS } from '@/config/icons';
import { useQualityIssueDialog } from '../hooks/useQualityIssueDialog';
import type { QualityIssueResult, RemedyType } from '@/types/lab-operations';
import { QUALITY_ISSUE_DIALOG_LAYOUT, QUALITY_ISSUE_DIALOG_COPY, type ValidationAlertCopy } from './qualityIssueDialogConstants';
import { CatalogRejectionFields } from './CatalogRejectionFields';
import { QualityIssueDialogLoadingView, QualityIssueDialogErrorView } from './QualityIssueDialogViews';
import {
  RemedyDestinationPicker,
  type RemedyOption,
} from './RemedyDestinationPicker';

/** Re-export views for consumers that render them directly */
export { QualityIssueDialogLoadingView, QualityIssueDialogErrorView } from './QualityIssueDialogViews';

/** Grouped state for form body (readability and future prop additions). */
export interface QualityIssueFormState {
  error: string | null;
  escalationRequired: boolean;
  alertCopy: ValidationAlertCopy | null;
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

interface QualityIssueDialogFormBodyProps {
  state: QualityIssueFormState;
  actions: QualityIssueFormActions;
}

export const QualityIssueDialogFormBody: React.FC<QualityIssueDialogFormBodyProps> = ({
  state,
  actions,
}) => {
  const {
    error,
    alertCopy,
    rejectionReason,
    rejectionNotes,
    allowedCriteria,
    criteriaLoading,
    preferredRemedy,
    remedyOptions,
  } = state;
  const { onReasonChange, onNotesChange, onRemedyChange } = actions;
  const copy = alertCopy ?? {
    variant: 'warning' as const,
    warningTitle: QUALITY_ISSUE_DIALOG_COPY.reject.warningTitle,
    warningBody: QUALITY_ISSUE_DIALOG_COPY.reject.warningBody,
    confirmLabel: QUALITY_ISSUE_DIALOG_COPY.reject.confirmLabel,
    reasonLabel: QUALITY_ISSUE_DIALOG_COPY.reject.reasonLabel,
    notesLabel: QUALITY_ISSUE_DIALOG_COPY.reject.notesLabel,
  };

  return (
    <>
      {error && (
        <Alert variant="danger" className="py-2">
          <p className="text-xs">{error}</p>
        </Alert>
      )}

      <Alert variant={copy.variant} className="py-2">
        <div className="space-y-0.5">
          <p className="font-normal text-xs">{copy.warningTitle}</p>
          <p className="text-xxs opacity-90 leading-tight">{copy.warningBody}</p>
        </div>
      </Alert>

      <CatalogRejectionFields
        criteria={allowedCriteria}
        criteriaLoading={criteriaLoading}
        rejectionReason={rejectionReason}
        rejectionNotes={rejectionNotes}
        onReasonChange={onReasonChange}
        onNotesChange={onNotesChange}
        reasonLabel={copy.reasonLabel}
        showNotes={false}
      />

      <RemedyDestinationPicker
        options={remedyOptions}
        value={preferredRemedy}
        onChange={onRemedyChange}
      />

      <CatalogRejectionFields
        criteria={allowedCriteria}
        rejectionReason={rejectionReason}
        rejectionNotes={rejectionNotes}
        onReasonChange={onReasonChange}
        onNotesChange={onNotesChange}
        notesLabel={copy.notesLabel}
        notesRows={QUALITY_ISSUE_DIALOG_LAYOUT.reasonTextareaRows}
        showReason={false}
      />
    </>
  );
};

interface QualityIssueDialogContentProps {
  orderTestId: number;
  testName?: string;
  testCode?: string;
  patientName?: string;
  onConfirm: (result: QualityIssueResult) => void;
  onCancel: () => void;
  onSubmittingChange?: (submitting: boolean) => void;
}

const QualityIssueDialogContent: React.FC<QualityIssueDialogContentProps> = ({
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
    alertCopy,
    handleConfirm,
    handleRetry,
    subtitle,
    copy,
  } = useQualityIssueDialog({
    orderTestId,
    testName,
    testCode,
    patientName,
    onConfirm,
    onCancel,
    onSubmittingChange,
  });

  if (isLoading) return <QualityIssueDialogLoadingView />;
  if (error && !options) {
    return <QualityIssueDialogErrorView error={error} onRetry={handleRetry} onCancel={onCancel} />;
  }

  return (
    <PopoverForm
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
      <QualityIssueDialogFormBody
        state={{
          error,
          escalationRequired: alertCopy?.variant === 'danger',
          alertCopy,
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
    </PopoverForm>
  );
};

interface QualityIssueDialogProps {
  orderTestId: number;
  testCode?: string;
  testName?: string;
  patientName?: string;
  onReject: (result: QualityIssueResult) => void;
  trigger?: React.ReactNode;
}

export const QualityIssueDialog: React.FC<QualityIssueDialogProps> = ({
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
      offsetValue={QUALITY_ISSUE_DIALOG_LAYOUT.popoverOffset}
      preventClose={effectiveSubmitting}
      trigger={
        trigger ?? (
          <Button variant="reject" size="sm" title={QUALITY_ISSUE_DIALOG_COPY.triggerTitle}>
            {QUALITY_ISSUE_DIALOG_COPY.triggerTitle}
          </Button>
        )
      }
    >
      {({ close }) => (
        <div data-popover-content onClick={e => e.stopPropagation()}>
          <QualityIssueDialogContent
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
