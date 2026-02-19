/**
 * RejectionDialog view subcomponents: Loading, Error, and Action Cards.
 * Extracted to keep RejectionDialog.tsx focused on orchestration.
 */

import React from 'react';
import { Alert, Button, Skeleton } from '@/components';
import { RadioCard } from './PopoverForm';
import type { ResultRejectionType } from '@/types';
import { cn } from '@/utils';
import { REJECTION_DIALOG_LAYOUT, REJECTION_DIALOG_COPY } from './rejection-dialog-constants';

/** Skeleton that mirrors PopoverForm layout (header, body, footer) to avoid layout shift when options load. */
export const RejectionDialogLoadingView: React.FC = () => (
  <div
    className={cn(
      REJECTION_DIALOG_LAYOUT.widthClass,
      'bg-surface rounded-lg shadow-xl border border-border-default overflow-hidden flex flex-col max-h-[600px]'
    )}
  >
    {/* Header */}
    <div className="px-4 py-3 bg-surface-page border-b border-border-subtle flex items-start justify-between">
      <div className="space-y-0.5">
        <Skeleton height={20} width="60%" className="rounded-md" />
        <Skeleton height={12} width="40%" className="rounded-md" />
      </div>
      <Skeleton width={32} height={32} className="rounded-md shrink-0" />
    </div>
    {/* Body */}
    <div className="p-4 space-y-4 overflow-y-auto flex-1">
      <div className="space-y-1.5">
        <Skeleton height={14} width="100%" className="rounded-md" />
        <Skeleton height={12} width="85%" className="rounded-md" />
      </div>
      <div className="space-y-2">
        <Skeleton height={12} width="30%" className="rounded-md" />
        <Skeleton height={52} width="100%" className="rounded-md" />
        <Skeleton height={52} width="100%" className="rounded-md" />
      </div>
      <div>
        <Skeleton height={12} width="35%" className="rounded-md mb-1" />
        <Skeleton height={60} width="100%" className="rounded-md" />
      </div>
    </div>
    {/* Footer */}
    <div className="p-3 bg-surface-page border-t border-border-subtle flex items-center justify-between gap-2 shrink-0">
      <Skeleton height={12} width="50%" className="rounded-md" />
      <div className="flex items-center gap-2">
        <Skeleton height={32} width={70} className="rounded-md" />
        <Skeleton height={32} width={70} className="rounded-md" />
      </div>
    </div>
  </div>
);

export interface RejectionDialogErrorViewProps {
  error: string;
  onRetry: () => void;
  onCancel: () => void;
}

export const RejectionDialogErrorView: React.FC<RejectionDialogErrorViewProps> = ({
  error,
  onRetry,
  onCancel,
}) => (
  <div
    className={cn(
      REJECTION_DIALOG_LAYOUT.widthClass,
      'bg-surface rounded-lg shadow-xl border border-border-default p-4 space-y-4'
    )}
  >
    <Alert variant="danger" className="py-2">
      <p className="font-normal text-xs">{REJECTION_DIALOG_COPY.error.title}</p>
      <p className="text-xxs mt-1">{error}</p>
    </Alert>
    <div className="flex justify-end gap-2">
      <Button variant="cancel" size="sm" showIcon={false} onClick={onCancel}>
        {REJECTION_DIALOG_COPY.error.cancel}
      </Button>
      <Button variant="retry" size="sm" onClick={onRetry}>
        {REJECTION_DIALOG_COPY.error.retry}
      </Button>
    </div>
  </div>
);

export interface RejectionActionCardsProps {
  selectedType: ResultRejectionType;
  onSelect: (type: ResultRejectionType) => void;
  isActionEnabled: (action: 're-test' | 're-collect') => boolean;
  getDisabledReason: (action: 're-test' | 're-collect') => string | null;
  isRecollectBlocked: boolean;
  recollectBlockedReason: string | null;
  retestAttemptsRemaining: number;
  recollectionAttemptsRemaining: number;
  orderHasValidatedTests: boolean;
}

export const RejectionActionCards: React.FC<RejectionActionCardsProps> = ({
  selectedType,
  onSelect,
  isActionEnabled,
  getDisabledReason,
  isRecollectBlocked,
  recollectBlockedReason,
  retestAttemptsRemaining,
  recollectionAttemptsRemaining,
  orderHasValidatedTests,
}) => (
  <div>
    <label className="block text-xs font-normal text-text-tertiary mb-1">
      {REJECTION_DIALOG_COPY.actions.followUpLabel}
    </label>
    <div className="grid grid-cols-1 gap-2">
      <RadioCard
        name="rejection-type"
        selected={selectedType === 're-test'}
        onClick={() => isActionEnabled('re-test') && onSelect('re-test')}
        label={`${REJECTION_DIALOG_COPY.actions.retestLabel}${retestAttemptsRemaining > 0 ? REJECTION_DIALOG_COPY.actions.remaining(retestAttemptsRemaining) : ''}`}
        description={REJECTION_DIALOG_COPY.actions.retestDescription}
        variant="sky"
        disabled={!isActionEnabled('re-test')}
        disabledReason={getDisabledReason('re-test') || undefined}
      />
      <RadioCard
        name="rejection-type"
        selected={selectedType === 're-collect'}
        onClick={() => !isRecollectBlocked && onSelect('re-collect')}
        label={`${REJECTION_DIALOG_COPY.actions.newSampleLabel}${!orderHasValidatedTests && recollectionAttemptsRemaining > 0 ? REJECTION_DIALOG_COPY.actions.remaining(recollectionAttemptsRemaining) : ''}`}
        description={REJECTION_DIALOG_COPY.actions.newSampleDescription}
        variant="red"
        disabled={isRecollectBlocked}
        disabledReason={recollectBlockedReason || undefined}
      />
    </div>
  </div>
);
