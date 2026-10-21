/**
 * Supervisor exception queue card — same shell as recollection requests; actions in modal only.
 */
/* eslint-disable react-refresh/only-export-components -- queue card + colocated data hook */

import { useMemo, type FC } from 'react';
import { Card } from '@/components/surfaces';
import { cn } from '@/utils';
import { useUserLookup } from '@/lib/api/users';
import { useLabWorkflowCardClickGuard } from '../hooks';
import { useLabWorkflowResponsiveCard } from '../hooks/useLabWorkflowResponsiveCard';
import { deriveRetestContext } from '../utils/deriveRetestContext';
import { MOBILE_LIST_CARD } from '@/theme/recipes';
import type { TestWithContext } from '@/types';
import { QueueCard, QueueCardMobile } from './queueCardLayout';
import { TestWorkflowCardLeftColumn } from './queueCardLeftColumn';
import {
  EscalationExceptionBadges,
  EscalationExceptionReviewBody,
} from './escalation.shared';

export interface EscalationCardProps {
  test: TestWithContext;
  onClick: () => void;
  isMobile?: boolean;
}

export interface EscalationCardSharedData {
  test: TestWithContext;
  handleCardClick: (e?: React.MouseEvent) => void;
  getUserName: (userId: string) => string;
  rejection: ReturnType<typeof deriveRetestContext>;
  patientName: string;
}

export function useEscalationCardData(props: EscalationCardProps): EscalationCardSharedData {
  const { test, onClick } = props;
  const { getUserName } = useUserLookup();
  const handleCardClick = useLabWorkflowCardClickGuard(onClick);
  const rejection = useMemo(() => deriveRetestContext(test), [test]);

  return {
    test,
    handleCardClick,
    getUserName: (userId: string) => getUserName(userId),
    rejection,
    patientName: test.patientName || '—',
  };
}

function useEscalationCardHeader(test: TestWithContext, patientName: string) {
  const leftColumn = useMemo(
    () => (
      <TestWorkflowCardLeftColumn
        test={test}
        patientName={patientName}
        variant="escalation"
        queueSince={test.resultEnteredAt ?? test.orderDate}
        reasonCode={test.reasonCode}
        includeResultEntered
      />
    ),
    [test, patientName]
  );

  const badges = <EscalationExceptionBadges test={test} />;

  return { leftColumn, badges };
}

function EscalationCardDesktop({ test, handleCardClick, rejection, patientName }: EscalationCardSharedData) {
  const { showAttemptIndicator } = rejection;
  const { leftColumn, badges } = useEscalationCardHeader(test, patientName);

  return (
    <QueueCard
      onClick={handleCardClick}
      className={showAttemptIndicator ? 'border-warning-stroke-emphasis' : ''}
      leftColumn={leftColumn}
      badges={badges}
      contentTitle="Supervisor exception"
      content={<EscalationExceptionReviewBody test={test} />}
    />
  );
}

function EscalationCardMobile({ test, handleCardClick, rejection, patientName }: EscalationCardSharedData) {
  const { showAttemptIndicator } = rejection;
  const { leftColumn, badges } = useEscalationCardHeader(test, patientName);

  return (
    <Card
      padding="sm"
      hover
      className={cn(
        MOBILE_LIST_CARD.surface,
        showAttemptIndicator && 'border-warning-stroke-emphasis'
      )}
      onClick={handleCardClick}
    >
      <QueueCardMobile leftColumn={leftColumn} badges={badges}>
        <div className={cn(MOBILE_LIST_CARD.body, 'space-y-space-0-5')}>
          <EscalationExceptionReviewBody test={test} />
        </div>
      </QueueCardMobile>
    </Card>
  );
}

export const EscalationCard: FC<EscalationCardProps> = props => {
  const sharedData = useEscalationCardData(props);

  return useLabWorkflowResponsiveCard({
    item: props,
    deriveSharedData: () => sharedData,
    renderMobile: EscalationCardMobile,
    renderDesktop: EscalationCardDesktop,
    isMobile: props.isMobile,
  });
};
