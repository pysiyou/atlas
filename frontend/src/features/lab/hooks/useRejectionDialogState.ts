/**
 * useRejectionDialogState - Derived state for rejection dialog
 *
 * Encapsulates rejection rules: re-collect blocked, default action type,
 * selected type (user override vs default), and confirm button disabled state.
 */

import { useState, useMemo } from 'react';
import type { ResultRejectionType } from '@/types';
import type { RejectionOptionsResponse } from '@/types/lab-operations';
import { REJECTION_DIALOG_COPY } from '../components/rejection-dialog-constants';

interface RejectionManagerState {
  options: RejectionOptionsResponse | null;
  isActionEnabled: (action: 're-test' | 're-collect') => boolean;
  getDisabledReason: (action: 're-test' | 're-collect') => string | null;
  escalationRequired: boolean;
}

function getDefaultRejectionType(
  options: RejectionOptionsResponse | null,
  isActionEnabled: (action: 're-test' | 're-collect') => boolean,
  isRecollectBlocked: boolean
): ResultRejectionType {
  if (options && isActionEnabled('re-test')) return 're-test';
  if (!isRecollectBlocked) return 're-collect';
  return 're-test';
}

function getIsConfirmDisabled(
  escalationRequired: boolean,
  hasReason: boolean,
  isActionEnabled: (action: 're-test' | 're-collect') => boolean,
  isRecollectBlocked: boolean
): boolean {
  if (escalationRequired) return !hasReason;
  return !hasReason || (!isActionEnabled('re-test') && isRecollectBlocked);
}

export interface UseRejectionDialogStateArgs {
  manager: RejectionManagerState;
  orderHasValidatedTests: boolean;
  reason: string;
}

export interface UseRejectionDialogStateReturn {
  selectedType: ResultRejectionType;
  setUserOverride: (value: ResultRejectionType | null) => void;
  isRecollectBlocked: boolean;
  recollectBlockedReason: string | null;
  defaultType: ResultRejectionType;
  isConfirmDisabled: boolean;
}

export function useRejectionDialogState({
  manager,
  orderHasValidatedTests,
  reason,
}: UseRejectionDialogStateArgs): UseRejectionDialogStateReturn {
  const [userOverride, setUserOverride] = useState<ResultRejectionType | null>(null);

  const { options, isActionEnabled, getDisabledReason, escalationRequired } = manager;

  const isRecollectBlocked = orderHasValidatedTests || !isActionEnabled('re-collect');
  const recollectBlockedReason = orderHasValidatedTests
    ? REJECTION_DIALOG_COPY.recollectBlocked
    : getDisabledReason('re-collect');

  const defaultType = useMemo(
    () => getDefaultRejectionType(options, isActionEnabled, isRecollectBlocked),
    [options, isActionEnabled, isRecollectBlocked]
  );

  const selectedType = userOverride ?? defaultType;

  const hasReason = reason.trim().length > 0;
  const isConfirmDisabled = useMemo(
    () =>
      getIsConfirmDisabled(
        escalationRequired,
        hasReason,
        isActionEnabled,
        isRecollectBlocked
      ),
    [escalationRequired, hasReason, isActionEnabled, isRecollectBlocked]
  );

  return {
    selectedType,
    setUserOverride,
    isRecollectBlocked,
    recollectBlockedReason,
    defaultType,
    isConfirmDisabled,
  };
}
