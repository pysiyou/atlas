/**
 * RejectionDialog - Popover for rejecting test results.
 * Validator chooses reason + destination (retest / recollect / cancel / escalate).
 */

import React, { useState } from 'react';
import { Popover, Button, Alert, FooterInfo } from '@/components';
import { PopoverForm } from './PopoverForm';
import { MODULE_ICONS } from '@/config/icons';
import { useRejectionDialog } from '../hooks/useRejectionDialog';
import type { QualityIssueResult, RemedyType } from '@/types/lab-operations';
import { REJECTION_DIALOG_LAYOUT, REJECTION_DIALOG_COPY, type ValidationAlertCopy } from './rejectionDialogConstants';
import { CatalogRejectionFields } from './CatalogRejectionFields';
import { RejectionDialogLoadingView, RejectionDialogErrorView } from './RejectionDialogViews';
import {
  RemedyDestinationPicker,
  type RemedyOption,
} from './RemedyDestinationPicker';
import { AttemptProgressBar } from './AttemptProgressBar';
import { GENERATED_LAB_CONSTANTS } from '@/types/generated/labConstants';

/** Re-export views for consumers that render them directly */
export { RejectionDialogLoadingView, RejectionDialogErrorView } from './RejectionDialogViews';

/** Grouped state for form body (readability and future prop additions). */
export interface RejectionFormState {
  error: string | null;
  escalationRequired: boolean;
  alertCopy: ValidationAlertCopy | null;
  rejectionReason: string;
  rejectionNotes: string;
  allowedCriteria: string[];
  criteriaLoading: boolean;
  preferredRemedy: RemedyType | '';
  remedyOptions: RemedyOption[];
  retestAttemptsUsed?: number;
  retestAttemptsRemaining?: number;
}

/** Grouped actions for form body. */
export interface RejectionFormActions {
  onReasonChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onRemedyChange: (value: RemedyType) => void;
}

interface RejectionDialogFormBodyProps {
  state: RejectionFormState;
  actions: RejectionFormActions;
}

export const RejectionDialogFormBody: React.FC<RejectionDialogFormBodyProps> = ({
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
    retestAttemptsUsed = 0,
  } = state;
  const { onReasonChange, onNotesChange, onRemedyChange } = actions;
  const copy = alertCopy ?? {
    variant: 'warning' as const,
    warningTitle: REJECTION_DIALOG_COPY.reject.warningTitle,
    warningBody: REJECTION_DIALOG_COPY.reject.warningBody,
    confirmLabel: REJECTION_DIALOG_COPY.reject.confirmLabel,
    reasonLabel: REJECTION_DIALOG_COPY.reject.reasonLabel,
    notesLabel: REJECTION_DIALOG_COPY.reject.notesLabel,
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

      <AttemptProgressBar
        used={retestAttemptsUsed}
        total={GENERATED_LAB_CONSTANTS.MAX_RETEST_ATTEMPTS}
        label="Re-test"
      />

      <CatalogRejectionFields
        criteria={allowedCriteria}
        criteriaLoading={criteriaLoading}
        rejectionReason={rejectionReason}
        rejectionNotes={rejectionNotes}
        onReasonChange={onReasonChange}
        onNotesChange={onNotesChange}
        reasonLabel={copy.reasonLabel}
        notesLabel={copy.notesLabel}
        notesRows={REJECTION_DIALOG_LAYOUT.reasonTextareaRows}
      />

      <RemedyDestinationPicker
        options={remedyOptions}
        value={preferredRemedy}
        onChange={onRemedyChange}
      />
    </>
  );
};

interface RejectionDialogContentProps {
  orderTestId: number;
  testName?: string;
  testCode?: string;
  patientName?: string;
  onConfirm: (result: QualityIssueResult) => void;
  onCancel: () => void;
  onSubmittingChange?: (submitting: boolean) => void;
}

const RejectionDialogContent: React.FC<RejectionDialogContentProps> = ({
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
  } = useRejectionDialog({
    orderTestId,
    testName,
    testCode,
    patientName,
    onConfirm,
    onCancel,
    onSubmittingChange,
  });

  if (isLoading) return <RejectionDialogLoadingView />;
  if (error && !options) {
    return <RejectionDialogErrorView error={error} onRetry={handleRetry} onCancel={onCancel} />;
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
      <RejectionDialogFormBody
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
          retestAttemptsUsed: options?.retestAttemptsUsed,
          retestAttemptsRemaining: options?.retestAttemptsRemaining,
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

interface RejectionDialogProps {
  orderTestId: number;
  testCode?: string;
  testName?: string;
  patientName?: string;
  onReject: (result: QualityIssueResult) => void;
  trigger?: React.ReactNode;
}

export const RejectionDialog: React.FC<RejectionDialogProps> = ({
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
      offsetValue={REJECTION_DIALOG_LAYOUT.popoverOffset}
      preventClose={effectiveSubmitting}
      trigger={
        trigger ?? (
          <Button variant="reject" size="sm" title={REJECTION_DIALOG_COPY.triggerTitle}>
            {REJECTION_DIALOG_COPY.triggerTitle}
          </Button>
        )
      }
    >
      {({ close }) => (
        <div data-popover-content onClick={e => e.stopPropagation()}>
          <RejectionDialogContent
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
