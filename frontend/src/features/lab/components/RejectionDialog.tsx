/**
 * RejectionDialog - Popover for rejecting test results
 *
 * Provides a consistent interface for all rejection scenarios:
 * - Fetches available actions from the API (dynamic limits)
 * - Displays remaining attempts for each action
 * - Shows escalation warning when all options exhausted
 * - Handles loading, error, and success states
 * - Result rejection is popover-only (no modal).
 */

import React, { useState } from 'react';
import { Popover, IconButton, Alert, FooterInfo, SpinnerLoader } from '@/components';
import { PopoverForm } from './PopoverForm';
import { MODULE_ICONS } from '@/config/icons';
import { useRejectionDialog } from '../hooks/useRejectionDialog';
import type { RejectionResult } from '@/types/lab-operations';
import { REJECTION_DIALOG_LAYOUT, REJECTION_DIALOG_COPY } from './rejectionDialogConstants';
import { CatalogRejectionFields } from './CatalogRejectionFields';
import { RejectionDialogLoadingView, RejectionDialogErrorView } from './RejectionDialogViews';

/** Re-export views for consumers that render them directly */
export { RejectionDialogLoadingView, RejectionDialogErrorView } from './RejectionDialogViews';

/** Grouped state for form body (readability and future prop additions). */
export interface RejectionFormState {
  error: string | null;
  escalationRequired: boolean;
  rejectionReason: string;
  rejectionNotes: string;
  allowedCriteria: string[];
  criteriaLoading: boolean;
}

/** Grouped actions for form body. */
export interface RejectionFormActions {
  onReasonChange: (value: string) => void;
  onNotesChange: (value: string) => void;
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
    escalationRequired,
    rejectionReason,
    rejectionNotes,
    allowedCriteria,
    criteriaLoading,
  } = state;
  const { onReasonChange, onNotesChange } = actions;
  const copy = escalationRequired ? REJECTION_DIALOG_COPY.escalation : REJECTION_DIALOG_COPY.reject;

  return (
    <>
      {error && (
        <Alert variant="danger" className="py-2">
          <p className="text-xs">{error}</p>
        </Alert>
      )}

      <Alert variant={escalationRequired ? 'danger' : 'warning'} className="py-2">
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
        notesLabel={copy.notesLabel}
        notesRows={REJECTION_DIALOG_LAYOUT.reasonTextareaRows}
      />
    </>
  );
};

interface RejectionDialogContentProps {
  orderId: string | number;
  testCode: string;
  testName?: string;
  patientName?: string;
  onConfirm: (result: RejectionResult) => void;
  onCancel: () => void;
  /** Notify parent when submitting state changes (for preventClose). */
  onSubmittingChange?: (submitting: boolean) => void;
}

/** Orchestrator: loading → error → form. No long JSX, no inline copy. */
export const RejectionDialogContent: React.FC<RejectionDialogContentProps> = ({
  orderId,
  testCode,
  testName,
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
    isConfirmDisabled,
    isLoading,
    isRejecting,
    error,
    options,
    escalationRequired,
    handleConfirm,
    handleRetry,
    subtitle,
    copy,
  } = useRejectionDialog({
    orderId,
    testCode,
    testName,
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
          escalationRequired,
          rejectionReason,
          rejectionNotes,
          allowedCriteria: options?.allowedRejectionCriteria ?? [],
          criteriaLoading: isLoading,
        }}
        actions={{
          onReasonChange: setRejectionReason,
          onNotesChange: setRejectionNotes,
        }}
      />
    </PopoverForm>
  );
};

interface RejectionDialogProps {
  orderId: string | number;
  testCode: string;
  testName?: string;
  patientName?: string;
  onReject: (result: RejectionResult) => void;
  trigger?: React.ReactNode;
}

export const RejectionDialog: React.FC<RejectionDialogProps> = ({
  orderId,
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
          <IconButton variant="reject" size="sm" title={REJECTION_DIALOG_COPY.triggerTitle} />
        )
      }
    >
      {({ close }) => (
        <div data-popover-content onClick={e => e.stopPropagation()}>
          <RejectionDialogContent
            orderId={orderId}
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

interface RejectionHistoryBannerProps {
  isRetest?: boolean;
  retestNumber?: number;
  isRecollection?: boolean;
  recollectionAttempt?: number;
  rejectionReason?: string;
}

export const RejectionHistoryBanner: React.FC<RejectionHistoryBannerProps> = ({
  isRetest,
  retestNumber,
  isRecollection,
  recollectionAttempt,
  rejectionReason,
}) => {
  if (!isRetest && !isRecollection) return null;

  const getMessage = () => {
    if (isRetest && retestNumber) return `Re-test #${retestNumber}`;
    if (isRecollection && recollectionAttempt && recollectionAttempt > 1) {
      return `Recollection #${recollectionAttempt - 1}`;
    }
    return null;
  };

  const message = getMessage();
  if (!message) return null;

  return (
    <div className="mt-2 px-2 py-1.5 bg-warning-bg border border-warning-stroke rounded text-warning-fg">
      <div className="flex items-center gap-1.5">
        <SpinnerLoader size="xs" />
        <span className="text-xxs font-normal">{message}</span>
      </div>
      {rejectionReason && (
        <p className="text-xxs mt-0.5 opacity-80 line-clamp-2">
          Previous rejection: {rejectionReason}
        </p>
      )}
    </div>
  );
};
