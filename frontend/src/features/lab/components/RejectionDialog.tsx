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
import { Popover, IconButton, Icon, Alert, FooterInfo } from '@/shared/ui';
import { PopoverForm } from './PopoverForm';
import { useRejectionManager } from '../hooks/useRejectionManager';
import { useRejectionDialogState } from '../hooks/useRejectionDialogState';
import type { ResultRejectionType } from '@/types';
import type { RejectionResult } from '@/types/lab-operations';
import { cn, ICONS } from '@/utils';
import { inputBase } from '@/shared/ui/inputStyles';
import {
  REJECTION_DIALOG_LAYOUT,
  REJECTION_DIALOG_COPY,
} from './rejection-dialog-constants';
import {
  RejectionDialogLoadingView,
  RejectionDialogErrorView,
  RejectionActionCards,
} from './RejectionDialogViews';

/** Build subtitle from test/patient context */
function buildRejectionSubtitle(
  testName?: string,
  testCode?: string,
  patientName?: string
): string {
  return [testName, testCode ? `(${testCode})` : '', patientName ? `- ${patientName}` : '']
    .filter(Boolean)
    .join(' ');
}

/** Re-export views for consumers that render them directly */
export { RejectionDialogLoadingView, RejectionDialogErrorView } from './RejectionDialogViews';

/** Grouped state for form body (readability and future prop additions). */
export interface RejectionFormState {
  error: string | null;
  escalationRequired: boolean;
  selectedType: ResultRejectionType;
  reason: string;
  isRecollectBlocked: boolean;
  recollectBlockedReason: string | null;
  retestAttemptsRemaining: number;
  recollectionAttemptsRemaining: number;
  orderHasValidatedTests: boolean;
}

/** Grouped actions for form body. */
export interface RejectionFormActions {
  onSelectType: (type: ResultRejectionType) => void;
  onReasonChange: (value: string) => void;
  isActionEnabled: (action: 're-test' | 're-collect') => boolean;
  getDisabledReason: (action: 're-test' | 're-collect') => string | null;
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
    selectedType,
    reason,
    isRecollectBlocked,
    recollectBlockedReason,
    retestAttemptsRemaining,
    recollectionAttemptsRemaining,
    orderHasValidatedTests,
  } = state;
  const { onSelectType, onReasonChange, isActionEnabled, getDisabledReason } = actions;

  return (
  <>
    {error && (
      <Alert variant="danger" className="py-2">
        <p className="text-xs">{error}</p>
      </Alert>
    )}

    {escalationRequired && (
      <Alert variant="danger" className="py-2">
        <div className="space-y-0.5">
          <p className="font-normal text-xs">{REJECTION_DIALOG_COPY.escalation.warningTitle}</p>
          <p className="text-xxs opacity-90 leading-tight">
            {REJECTION_DIALOG_COPY.escalation.warningBody}
          </p>
        </div>
      </Alert>
    )}

    {!escalationRequired && (
      <Alert variant="warning" className="py-2">
        <div className="space-y-0.5">
          <p className="font-normal text-xs">{REJECTION_DIALOG_COPY.reject.warningTitle}</p>
          <p className="text-xxs opacity-90 leading-tight">
            {REJECTION_DIALOG_COPY.reject.warningBody}
          </p>
        </div>
      </Alert>
    )}

    {!escalationRequired && (
      <RejectionActionCards
        selectedType={selectedType}
        onSelect={onSelectType}
        isActionEnabled={isActionEnabled}
        getDisabledReason={getDisabledReason}
        isRecollectBlocked={isRecollectBlocked}
        recollectBlockedReason={recollectBlockedReason}
        retestAttemptsRemaining={retestAttemptsRemaining}
        recollectionAttemptsRemaining={recollectionAttemptsRemaining}
        orderHasValidatedTests={orderHasValidatedTests}
      />
    )}

    <div>
      <label className="block text-xs font-normal text-text-tertiary mb-1">
        {escalationRequired
          ? REJECTION_DIALOG_COPY.escalation.reasonLabel
          : REJECTION_DIALOG_COPY.reject.reasonLabel}{' '}
        <span className="text-danger-fg">*</span>
      </label>
      <textarea
        rows={REJECTION_DIALOG_LAYOUT.reasonTextareaRows}
        placeholder={
          escalationRequired
            ? REJECTION_DIALOG_COPY.escalation.reasonPlaceholder
            : REJECTION_DIALOG_COPY.reject.reasonPlaceholder
        }
        value={reason}
        onChange={e => onReasonChange(e.target.value)}
        className={cn(inputBase, 'resize-none')}
      />
    </div>
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
  orderHasValidatedTests?: boolean;
}

/** Orchestrator: loading → error → form. No long JSX, no inline copy. */
export const RejectionDialogContent: React.FC<RejectionDialogContentProps> = ({
  orderId,
  testCode,
  testName,
  patientName,
  onConfirm,
  onCancel,
  orderHasValidatedTests = false,
}) => {
  const [reason, setReason] = useState('');

  const manager = useRejectionManager({ orderId, testCode, autoFetch: true });
  const {
    options,
    isLoading,
    isRejecting,
    error,
    fetchOptions,
    rejectWithAction,
    isActionEnabled,
    getDisabledReason,
    retestAttemptsRemaining,
    recollectionAttemptsRemaining,
    escalationRequired,
    clearError,
  } = manager;

  const {
    selectedType,
    setUserOverride,
    isRecollectBlocked,
    recollectBlockedReason,
    isConfirmDisabled,
  } = useRejectionDialogState({
    manager: {
      options,
      isActionEnabled,
      getDisabledReason,
      escalationRequired,
    },
    orderHasValidatedTests,
    reason,
  });

  const handleConfirm = async () => {
    if (!reason.trim()) return;
    const actionType: ResultRejectionType = escalationRequired ? 'escalate' : selectedType;
    const result = await rejectWithAction(actionType, reason);
    if (result) onConfirm(result);
  };

  const handleRetry = () => {
    clearError();
    fetchOptions();
  };

  const subtitle = buildRejectionSubtitle(testName, testCode, patientName);

  if (isLoading) return <RejectionDialogLoadingView />;
  if (error && !options) {
    return (
      <RejectionDialogErrorView
        error={error}
        onRetry={handleRetry}
        onCancel={onCancel}
      />
    );
  }

  const copy = escalationRequired ? REJECTION_DIALOG_COPY.escalation : REJECTION_DIALOG_COPY.reject;

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
      footerInfo={<FooterInfo icon={ICONS.actions.alertCircle} text={copy.footerInfo} />}
    >
      <RejectionDialogFormBody
        state={{
          error,
          escalationRequired,
          selectedType,
          reason,
          isRecollectBlocked,
          recollectBlockedReason,
          retestAttemptsRemaining,
          recollectionAttemptsRemaining,
          orderHasValidatedTests,
        }}
        actions={{
          onSelectType: setUserOverride,
          onReasonChange: setReason,
          isActionEnabled,
          getDisabledReason,
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
  orderHasValidatedTests?: boolean;
}

export const RejectionDialog: React.FC<RejectionDialogProps> = ({
  orderId,
  testCode,
  testName,
  patientName,
  onReject,
  trigger,
  orderHasValidatedTests,
}) => (
  <Popover
    placement="bottom-end"
    offsetValue={REJECTION_DIALOG_LAYOUT.popoverOffset}
    trigger={
      trigger ?? (
        <IconButton variant="delete" size="sm" title={REJECTION_DIALOG_COPY.triggerTitle} />
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
          orderHasValidatedTests={orderHasValidatedTests}
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
        <Icon name={ICONS.actions.loading} className="w-3 h-3" />
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
