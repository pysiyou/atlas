/**
 * EscalationCard hooks - shared data derivation for mobile/desktop variants
 */

import { useMemo } from 'react';
import { useUserLookup } from '@/lib/api/users.api';
import { useLabCardClickGuard, useTestWorkItemState } from '@/features/lab/hooks';
import { deriveRetestContext } from '../../utils/deriveRetestContext';
import type { TestWithContext } from '@/types';

export interface EscalationCardProps {
  test: TestWithContext;
  onClick: () => void;
  isMobile?: boolean;
}

export interface EscalationCardSharedData {
  test: TestWithContext;
  onClick: () => void;
  handleCardClick: (e?: React.MouseEvent) => void;
  getUserName: (userId: string) => string;
  rejection: ReturnType<typeof deriveRetestContext>;
  blockedLabel?: string;
  isRetest: boolean;
  hasRejectionHistory: boolean;
}

export function useEscalationCardData(props: EscalationCardProps): EscalationCardSharedData {
  const { test, onClick } = props;
  const { getUserName } = useUserLookup();
  const handleCardClick = useLabCardClickGuard(onClick);
  const workItem = useTestWorkItemState(test);
  
  const rejection = useMemo(() => deriveRetestContext(test), [test]);
  
  return {
    test,
    onClick,
    handleCardClick,
    getUserName: (userId: string) => getUserName(userId),
    rejection,
    blockedLabel: workItem.blockedReason ? workItem.label : undefined,
    isRetest: rejection.isRetest,
    hasRejectionHistory: rejection.showAttemptIndicator,
  };
}
