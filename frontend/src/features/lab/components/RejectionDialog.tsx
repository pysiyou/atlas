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
import {
  Popover,
  IconButton,
  Icon,
  Alert,
  Button,
  ClaudeLoader,
  FooterInfo,
} from '@/shared/ui';
import { PopoverForm, RadioCard } from './PopoverForm';
import { useRejectionManager } from '../hooks/useRejectionManager';
import type { ResultRejectionType } from '@/types';
import type { RejectionResult } from '@/types/lab-operations';
import { cn, ICONS } from '@/utils';
import { inputBase } from '@/shared/ui/forms/inputStyles';

interface RejectionDialogContentProps {
  orderId: string | number;
  testCode: string;
  testName?: string;
  patientName?: string;
  onConfirm: (result: RejectionResult) => void;
  onCancel: () => void;
  /**
   * When true, the re-collect option is blocked because the order contains
   * validated tests. Rejecting the sample would invalidate those results.
   */
  orderHasValidatedTests?: boolean;
}

/**
 * Content for the rejection dialog
 * Fetches options from API and displays available actions
 */
// Large component is necessary for comprehensive rejection dialog with API integration, action management, and conditional UI
// eslint-disable-next-line max-lines-per-function
export const RejectionDialogContent: React.FC<RejectionDialogContentProps> = ({
  orderId,
  testCode,
  testName,
  patientName,
  onConfirm,
  onCancel,
  orderHasValidatedTests = false,
  // High complexity is necessary for comprehensive rejection logic with multiple conditional branches and state management
  // eslint-disable-next-line complexity
}) => {
  const [reason, setReason] = useState('');
  /** User override; when null, we use the derived default from options. */
  const [userOverride, setUserOverride] = useState<ResultRejectionType | null>(null);

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
  } = useRejectionManager({ orderId, testCode, autoFetch: true });

  /**
   * Check if re-collect is allowed considering both API limits and validated tests.
   * Re-collect is blocked if:
   * 1. The API indicates it's not available (limit reached)
   * 2. The order has validated tests (would create contradiction)
   */
  const isRecollectBlocked = orderHasValidatedTests || !isActionEnabled('re-collect');
  const recollectBlockedReason = orderHasValidatedTests
    ? 'Order has validated tests - sample cannot be rejected'
    : getDisabledReason('re-collect');

  /** Default selection when options load: re-test if available, else re-collect if not blocked. */
  const defaultType: ResultRejectionType =
    options && isActionEnabled('re-test')
      ? 're-test'
      : !isRecollectBlocked
        ? 're-collect'
        : 're-test';
  const selectedType = userOverride ?? defaultType;

  const handleConfirm = async () => {
    if (!reason.trim()) return;

    const actionType: ResultRejectionType = escalationRequired ? 'escalate' : selectedType;
    const result = await rejectWithAction(actionType, reason);
    if (result) {
      onConfirm(result);
    }
  };

  const subtitle = [
    testName,
    testCode ? `(${testCode})` : '',
    patientName ? `- ${patientName}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  // Loading state
  if (isLoading) {
    return (
      <div className="w-90 md:w-96 bg-panel rounded-lg shadow-xl border border-stroke p-4 flex flex-col items-center justify-center gap-4">
        <ClaudeLoader size="md" />
        <p className="text-sm text-fg-subtle">Loading rejection options...</p>
      </div>
    );
  }

  // Error state
  if (error && !options) {
    return (
      <div className="w-90 md:w-96 bg-panel rounded-lg shadow-xl border border-stroke p-4 space-y-4">
        <Alert variant="danger" className="py-2">
          <p className="font-normal text-xs">Failed to load options</p>
          <p className="text-xxs mt-1">{error}</p>
        </Alert>
        <div className="flex justify-end gap-2">
          <Button variant="cancel" size="sm" showIcon={false} onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="retry"
            size="sm"
            onClick={() => {
              clearError();
              fetchOptions();
            }}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const isConfirmDisabled = escalationRequired
    ? !reason.trim()
    : !reason.trim() || (!isActionEnabled('re-test') && isRecollectBlocked);

  const body = (
    <>
      {/* Error Alert */}
      {error && (
        <Alert variant="danger" className="py-2">
          <p className="text-xs">{error}</p>
        </Alert>
      )}

      {/* Escalation Warning */}
      {escalationRequired && (
        <Alert variant="danger" className="py-2">
          <div className="space-y-0.5">
            <p className="font-normal text-xs">Escalation Required</p>
            <p className="text-xxs opacity-90 leading-tight">
              All rejection options have been exhausted. Please escalate to your supervisor.
            </p>
          </div>
        </Alert>
      )}

      {/* Warning Alert */}
      {!escalationRequired && (
        <Alert variant="warning" className="py-2">
          <div className="space-y-0.5">
            <p className="font-normal text-xs">Action Required</p>
            <p className="text-xxs opacity-90 leading-tight">
              You are rejecting results. Please specify the required follow-up action.
            </p>
          </div>
        </Alert>
      )}

      {/* Action Type Selection */}
      {!escalationRequired && (
        <div>
          <label className="block text-xs font-normal text-fg-subtle mb-1">Follow-up Action</label>
          <div className="grid grid-cols-1 gap-2">
            <RadioCard
              name="rejection-type"
              selected={selectedType === 're-test'}
              onClick={() => isActionEnabled('re-test') && setUserOverride('re-test')}
              label={`Re-test Sample${retestAttemptsRemaining > 0 ? ` (${retestAttemptsRemaining} remaining)` : ''}`}
              description="Perform the test again using the existing sample."
              variant="sky"
              disabled={!isActionEnabled('re-test')}
              disabledReason={getDisabledReason('re-test') || undefined}
            />
            <RadioCard
              name="rejection-type"
              selected={selectedType === 're-collect'}
              onClick={() => !isRecollectBlocked && setUserOverride('re-collect')}
              label={`New Sample Required${!orderHasValidatedTests && recollectionAttemptsRemaining > 0 ? ` (${recollectionAttemptsRemaining} remaining)` : ''}`}
              description="Reject current sample and request new collection."
              variant="red"
              disabled={isRecollectBlocked}
              disabledReason={recollectBlockedReason || undefined}
            />
          </div>
        </div>
      )}

      {/* Rejection / Escalation Reason */}
      <div>
        <label className="block text-xs font-normal text-fg-subtle mb-1">
          {escalationRequired ? 'Reason for escalation' : 'Rejection Reason'}{' '}
          <span className="text-danger-fg">*</span>
        </label>
        <textarea
          rows={3}
          placeholder={
            escalationRequired
              ? 'Please provide a reason for escalating to your supervisor...'
              : 'Please explain why the results are being rejected...'
          }
          value={reason}
          onChange={e => setReason(e.target.value)}
          className={cn(inputBase, 'resize-none')}
        />
      </div>
    </>
  );

  return (
    <PopoverForm
      title={escalationRequired ? 'Escalate to Supervisor' : 'Reject Results'}
      subtitle={subtitle || undefined}
      onCancel={onCancel}
      onConfirm={handleConfirm}
      confirmLabel={escalationRequired ? 'Escalate to Supervisor' : 'Reject'}
      confirmVariant="danger"
      isSubmitting={isRejecting}
      disabled={isConfirmDisabled}
      footerInfo={
        <FooterInfo
          icon={ICONS.actions.alertCircle}
          text={escalationRequired ? 'Escalating to supervisor' : 'Rejecting results'}
        />
      }
    >
      {body}
    </PopoverForm>
  );
};

/**
 * Props for the RejectionDialog popover wrapper
 */
interface RejectionDialogProps {
  orderId: string | number;
  testCode: string;
  testName?: string;
  patientName?: string;
  /** Called when rejection is successful */
  onReject: (result: RejectionResult) => void;
  /** Custom trigger element (defaults to IconButton) */
  trigger?: React.ReactNode;
  /**
   * When true, the re-collect option is blocked because the order contains
   * validated tests. Rejecting the sample would invalidate those results.
   */
  orderHasValidatedTests?: boolean;
}

/**
 * RejectionDialog - Opens result rejection flow in a popover.
 *
 * Shows remaining attempts and disables actions when limits are reached.
 */
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
    offsetValue={8}
    trigger={
      trigger ?? (
        <IconButton variant="delete" size="sm" title="Reject Results" />
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

/**
 * RejectionHistoryBanner - Displays rejection history on cards
 *
 * Shows a banner with information about previous rejections,
 * useful for retest and recollection attempts.
 */
interface RejectionHistoryBannerProps {
  /** Whether this is a retest */
  isRetest?: boolean;
  /** Retest number (1 = first retest, etc.) */
  retestNumber?: number;
  /** Whether this sample is a recollection */
  isRecollection?: boolean;
  /** Recollection attempt number */
  recollectionAttempt?: number;
  /** Latest rejection reason */
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
    if (isRetest && retestNumber) {
      return `Re-test #${retestNumber}`;
    }
    if (isRecollection && recollectionAttempt && recollectionAttempt > 1) {
      return `Recollection #${recollectionAttempt - 1}`;
    }
    return null;
  };

  const message = getMessage();
  if (!message) return null;

  return (
    <div className="mt-2 px-2 py-1.5 bg-warning-bg border border-warning-border rounded text-warning-text">
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
