/**
 * EscalationCard - Responsive card for escalated tests in the resolution queue.
 */

import React from 'react';
import { useUserLookup } from '@/lib/api/users.api';
import { useLabCardClickGuard, useTestWorkItemState } from '@/features/lab/hooks';
import { deriveRetestContext } from '../utils/deriveRetestContext';
import type { TestWithContext } from '@/types';
import { EscalationCardMobile } from './EscalationCardMobile';
import { EscalationCardDesktop } from './EscalationCardDesktop';

interface EscalationCardProps {
  test: TestWithContext;
  onClick: () => void;
  isMobile?: boolean;
}

export const EscalationCard: React.FC<EscalationCardProps> = ({
  test,
  onClick,
  isMobile = false,
}) => {
  const { getUserName } = useUserLookup();
  const handleCardClick = useLabCardClickGuard(onClick);
  const rejection = deriveRetestContext(test);
  const workItem = useTestWorkItemState(test);

  if (isMobile) {
    return (
      <EscalationCardMobile
        test={test}
        onClick={onClick}
        handleCardClick={handleCardClick}
        isRetest={rejection.isRetest}
        hasRejectionHistory={rejection.showAttemptIndicator}
        blockedLabel={workItem.blockedReason ? workItem.label : undefined}
      />
    );
  }

  return (
    <EscalationCardDesktop
      test={test}
      onClick={onClick}
      handleCardClick={handleCardClick}
      getUserName={(userId) => getUserName(String(userId))}
      rejection={rejection}
      blockedLabel={workItem.blockedReason ? workItem.label : undefined}
    />
  );
};
