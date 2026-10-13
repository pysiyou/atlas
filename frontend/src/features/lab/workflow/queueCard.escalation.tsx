/**
 * Escalation queue card — desktop/mobile shells, left header, data hooks.
 */
/* eslint-disable react-refresh/only-export-components -- queue card + colocated data hook */

import { useMemo, type FC } from 'react';
import { Button, Card, Icon } from '@/components';
import { cn } from '@/utils';
import { ICONS } from '@/config/icons';
import { useUserLookup } from '@/lib/api/users';
import { usePatientNameLookup } from '@/features/patients';
import { TestHeaderBadges } from '../components/LabWorkflowBadges';
import { useLabWorkflowCardClickGuard } from '../hooks';
import { useLabWorkflowResponsiveCard } from '../hooks/useLabWorkflowResponsiveCard';
import { deriveRetestContext } from '../utils/deriveRetestContext';
import { LAB_MOBILE_CARD } from '../utils/labStyles';
import type { TestWithContext } from '@/types';
import { QueueCard, QueueCardMobile } from './queueCardLayout';
import { TestWorkflowCardLeftColumn } from './queueCard.testWorkflowLeftColumn';

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
  isRetest: boolean;
  hasRejectionHistory: boolean;
  patientName: string;
}

export function useEscalationCardData(props: EscalationCardProps): EscalationCardSharedData {
  const { test, onClick } = props;
  const { getUserName } = useUserLookup();
  const { getPatientName } = usePatientNameLookup();
  const handleCardClick = useLabWorkflowCardClickGuard(onClick);
  const rejection = useMemo(() => deriveRetestContext(test), [test]);

  return {
    test,
    onClick,
    handleCardClick,
    getUserName: (userId: string) => getUserName(userId),
    rejection,
    isRetest: rejection.isRetest,
    hasRejectionHistory: rejection.showAttemptIndicator,
    patientName: getPatientName(test.patientId),
  };
}

function useEscalationCardHeader(test: TestWithContext, patientName: string) {
  const leftColumn = useMemo(
    () => (
      <TestWorkflowCardLeftColumn
        test={test}
        patientName={patientName}
        variant="escalation"
        reasonCode={test.reasonCode}
        includeResultEntered
      />
    ),
    [test, patientName]
  );

  const badges = <TestHeaderBadges test={test} variant="escalation" showStatus />;

  return { leftColumn, badges };
}

function EscalationCardDesktop({
  test,
  onClick,
  handleCardClick,
  rejection,
  patientName,
}: EscalationCardSharedData) {
  const { showAttemptIndicator } = rejection;
  const { leftColumn, badges } = useEscalationCardHeader(test, patientName);

  return (
    <QueueCard
      onClick={handleCardClick}
      className={showAttemptIndicator ? 'border-warning-stroke-emphasis' : ''}
      leftColumn={leftColumn}
      badges={badges}
      actionsPlacement="header"
      actions={
        <div className="flex items-center gap-space-2">
          <Button
            variant="primary"
            size="sm"
            icon={<Icon name={ICONS.actions.eye} className="text-on-brand" />}
            onClick={e => {
              e.stopPropagation();
              onClick();
            }}
          >
            View
          </Button>
        </div>
      }
    />
  );
}

function EscalationCardMobile({
  test,
  onClick,
  handleCardClick,
  rejection,
  patientName,
}: EscalationCardSharedData) {
  const { showAttemptIndicator } = rejection;
  const { leftColumn } = useEscalationCardHeader(test, patientName);

  return (
    <Card
      padding="sm"
      hover
      className={cn(
        LAB_MOBILE_CARD.surface,
        showAttemptIndicator && 'border-warning-stroke-emphasis'
      )}
      onClick={handleCardClick}
    >
      <QueueCardMobile
        leftColumn={leftColumn}
        badges={<TestHeaderBadges test={test} variant="escalation" size="xs" showStatus />}
        actionsPlacement="header"
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={<Icon name={ICONS.actions.eye} className="text-on-brand" />}
            onClick={e => {
              e.stopPropagation();
              onClick();
            }}
          >
            View
          </Button>
        }
      />
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
