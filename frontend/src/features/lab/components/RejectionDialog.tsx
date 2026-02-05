/**
 * RejectionDialog - Unified dialog for rejecting test results
 *
 * Provides a consistent interface for all rejection scenarios:
 * - Fetches available actions from the API (dynamic limits)
 * - Displays remaining attempts for each action
 * - Shows escalation warning when all options exhausted
 * - Handles loading, error, and success states
 * - Uses shared Modal when opened from RejectionDialog (trigger).
 */
/* eslint-disable max-lines */

import React, { useState } from 'react';
import {
  Modal,
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

export type RejectionDialogLayout = 'popover' | 'modal';

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
  /** When 'modal', content is rendered for use inside shared Modal (no PopoverForm wrapper). */
  layout?: RejectionDialogLayout;
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
  layout = 'popover',
  // High complexity is necessary for comprehensive rejection logic with multiple conditional branches and state management
  // eslint-disable-next-line complexity
}) => {
  const isModal = layout === 'modal';
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
      <div
        className={
          isModal
            ? 'flex flex-col items-center justify-center gap-4 py-8'
            : 'w-90 md:w-96 bg-surface-default rounded-lg shadow-xl border border-border-default p-8 flex flex-col items-center justify-center gap-4'
        }
      >
        <ClaudeLoader size="md" />
        <p className="text-sm text-text-tertiary">Loading rejection options...</p>
      </div>
    );
  }

  // Error state
  if (error && !options) {
    return (
      <div className={isModal ? 'space-y-4' : 'w-90 md:w-96 bg-surface-default rounded-lg shadow-xl border border-border-default p-4'}>
        <Alert variant="danger" className="mb-4">
          <p className="font-medium text-xs">Failed to load options</p>
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
            <p className="font-medium text-xs">Escalation Required</p>
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
            <p className="font-medium text-xs">Action Required</p>
            <p className="text-xxs opacity-90 leading-tight">
              You are rejecting results. Please specify the required follow-up action.
            </p>
          </div>
        </Alert>
      )}

      {/* Action Type Selection */}
      {!escalationRequired && (
        <div>
          <label className="block text-xs font-medium text-text-tertiary mb-1">Follow-up Action</label>
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
        <label className="block text-xs font-medium text-text-tertiary mb-1">
          {escalationRequired ? 'Reason for escalation' : 'Rejection Reason'}{' '}
          <span className="text-feedback-danger-text">*</span>
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

  if (isModal) {
    return (
      <div className="flex flex-col min-h-0">
        <div className="p-4 space-y-4 overflow-y-auto flex-1 min-h-0">{body}</div>
        <div className="px-6 py-4 border-t border-border-default bg-surface-default shrink-0 flex items-center justify-between gap-2">
          <FooterInfo
            icon={ICONS.actions.alertCircle}
            text={escalationRequired ? 'Escalating to supervisor' : 'Rejecting results'}
          />
          <div className="flex gap-2">
            <Button variant="cancel" size="sm" showIcon={false} onClick={onCancel}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              showIcon={false}
              onClick={handleConfirm}
              disabled={isConfirmDisabled}
              isLoading={isRejecting}
            >
              {escalationRequired ? 'Escalate to Supervisor' : 'Reject'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
 * RejectionDialog - Opens rejection flow in shared Modal (or Popover when trigger is custom)
 *
 * Uses shared Modal for consistency with other feature modals.
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
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const subtitle = [testName, testCode ? `(${testCode})` : '', patientName ? `- ${patientName}` : '']
    .filter(Boolean)
    .join(' ');

  const openModal = () => setIsOpen(true);
  const triggerEl =
    trigger === undefined ? (
      <IconButton variant="delete" size="sm" title="Reject Results" onClick={openModal} />
    ) : (
      <div onClick={openModal} role="button" tabIndex={0} onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), openModal())}>
        {trigger}
      </div>
    );

  return (
    <>
      {triggerEl}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Reject Results"
        subtitle={subtitle || undefined}
        size="md"
      >
        <RejectionDialogContent
          layout="modal"
          orderId={orderId}
          testCode={testCode}
          testName={testName}
          patientName={patientName}
          orderHasValidatedTests={orderHasValidatedTests}
          onConfirm={result => {
            onReject(result);
            setIsOpen(false);
          }}
          onCancel={() => setIsOpen(false)}
        />
      </Modal>
    </>
  );
};

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
    <div className="mt-2 px-2 py-1.5 bg-feedback-warning-bg border border-feedback-warning-border rounded text-feedback-warning-text">
      <div className="flex items-center gap-1.5">
        <Icon name={ICONS.actions.loading} className="w-3 h-3" />
        <span className="text-xxs font-medium">{message}</span>
      </div>
      {rejectionReason && (
        <p className="text-xxs mt-0.5 opacity-80 line-clamp-2">
          Previous rejection: {rejectionReason}
        </p>
      )}
    </div>
  );
};
