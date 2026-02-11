/**
 * RejectionDialog view subcomponents: Loading, Error, and Action Cards.
 * Extracted to keep RejectionDialog.tsx focused on orchestration.
 */

import React from 'react';
import { Alert, Button, ClaudeLoader } from '@/shared/ui';
import { RadioCard } from './PopoverForm';
import type { ResultRejectionType } from '@/types';
import { cn } from '@/utils';
import { REJECTION_DIALOG_LAYOUT, REJECTION_DIALOG_COPY } from './rejection-dialog-constants';

export const RejectionDialogLoadingView: React.FC = () => (
  <div
    className={cn(
      REJECTION_DIALOG_LAYOUT.widthClass,
      'bg-panel rounded-lg shadow-xl border border-stroke p-4 flex flex-col items-center justify-center gap-4'
    )}
  >
    <ClaudeLoader size="md" />
    <p className="text-sm text-fg-subtle">{REJECTION_DIALOG_COPY.loading.message}</p>
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
      'bg-panel rounded-lg shadow-xl border border-stroke p-4 space-y-4'
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
    <label className="block text-xs font-normal text-fg-subtle mb-1">
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
