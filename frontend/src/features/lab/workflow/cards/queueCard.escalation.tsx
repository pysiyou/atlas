/**
 * Supervisor exception queue card — same shell as recollection requests; actions in modal only.
 */
/* eslint-disable react-refresh/only-export-components -- queue card + colocated data hook */

import { useMemo, type FC } from 'react';
import { Card } from '@/components/surfaces';
import { cn } from '@/utils';
import { useUserLookup } from '@/lib/api/users';
import { useLabWorkflowCardClickGuard } from '../../hooks';
import { useLabWorkflowResponsiveCard } from '../../hooks/useLabWorkflowResponsiveCard';
import { MOBILE_LIST_CARD } from '@/theme/recipes';
import type { PendingEscalationItem } from '../../api/results';
import {
  labModalWorkItemFromDto,
  retestContextFromRow,
  type LabOrderTestQueueRow,
} from '../../types/labQueueChrome';
import { QueueCard, QueueCardMobile } from '../shared/queueCardLayout';
import { TestWorkflowCardLeftColumn } from '../shared/queueCardLeftColumn';
import {
  EscalationExceptionBadges,
  EscalationExceptionReviewBody,
} from '../shared/escalation.shared';

export interface EscalationCardProps {
  item: PendingEscalationItem;
  onClick: () => void;
  isMobile?: boolean;
}

export interface EscalationCardSharedData {
  item: PendingEscalationItem;
  chromeRow: LabOrderTestQueueRow;
  handleCardClick: (e?: React.MouseEvent) => void;
  getUserName: (userId: string) => string;
  rejection: ReturnType<typeof retestContextFromRow>;
  patientName: string;
}

export function useEscalationCardData(props: EscalationCardProps): EscalationCardSharedData {
  const { item, onClick } = props;
  const { getUserName } = useUserLookup();
  const handleCardClick = useLabWorkflowCardClickGuard(onClick);
  const chromeRow = useMemo(() => labModalWorkItemFromDto(item), [item]);
  const rejection = useMemo(() => retestContextFromRow(chromeRow), [chromeRow]);

  return {
    item,
    chromeRow,
    handleCardClick,
    getUserName: (userId: string) => getUserName(userId),
    rejection,
    patientName: item.patientName || '—',
  };
}

function useEscalationCardHeader(chromeRow: LabOrderTestQueueRow, patientName: string) {
  const leftColumn = useMemo(
    () => (
      <TestWorkflowCardLeftColumn
        row={chromeRow}
        patientName={patientName}
        variant="escalation"
        queueSince={chromeRow.resultEnteredAt ?? chromeRow.orderDate}
        reasonCode={chromeRow.reasonCode ?? undefined}
        includeResultEntered
      />
    ),
    [chromeRow, patientName]
  );

  const badges = <EscalationExceptionBadges row={chromeRow} />;

  return { leftColumn, badges };
}

function EscalationCardDesktop({
  chromeRow,
  handleCardClick,
  rejection,
  patientName,
}: EscalationCardSharedData) {
  const { showAttemptIndicator } = rejection;
  const { leftColumn, badges } = useEscalationCardHeader(chromeRow, patientName);

  return (
    <QueueCard
      onClick={handleCardClick}
      className={showAttemptIndicator ? 'border-warning-stroke-emphasis' : ''}
      leftColumn={leftColumn}
      badges={badges}
      contentTitle="Supervisor exception"
      content={<EscalationExceptionReviewBody row={chromeRow} />}
    />
  );
}

function EscalationCardMobile({
  chromeRow,
  handleCardClick,
  rejection,
  patientName,
}: EscalationCardSharedData) {
  const { showAttemptIndicator } = rejection;
  const { leftColumn, badges } = useEscalationCardHeader(chromeRow, patientName);

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
          <EscalationExceptionReviewBody row={chromeRow} />
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
