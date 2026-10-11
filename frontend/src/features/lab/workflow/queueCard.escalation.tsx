import type { FC } from 'react';
import { Button, Card, Icon } from '@/components';
import { cn } from '@/utils';
import { ICONS } from '@/config/icons';
import { TestCardAlerts, TestHeaderBadges } from '../components/LabWorkflowBadges';
import { testHeaderAudit } from '../constants/labWorkflowAuditLines';
import { QueueCard } from './queueCardLayout';
import { QueueCardMobile } from './queueCardLayout';
import { LAB_MOBILE_CARD } from '../utils/labStyles';
import { useLabWorkflowResponsiveCard } from '../hooks/useLabWorkflowResponsiveCard';
import {
  useEscalationCardData,
  type EscalationCardProps,
  type EscalationCardSharedData,
} from './queueCard.escalation.data';

export type { EscalationCardProps } from './queueCard.escalation.data';

function EscalationCardDesktop({
  test,
  onClick,
  handleCardClick,
  rejection,
}: EscalationCardSharedData) {
  const { showAttemptIndicator } = rejection;

  return (
    <QueueCard
      onClick={handleCardClick}
      className={showAttemptIndicator ? 'border-warning-stroke-emphasis' : ''}
      context={{
        patientName: test.patientName,
        patientId: test.patientId,
        orderId: test.orderId,
        orderTestId: test.id,
        sampleId: test.sampleId,
        entityCode: test.testCode,
        entityName: test.testName,
        referringPhysician: test.referringPhysician,
      }}
      auditLines={testHeaderAudit(test, { includeResultEntered: true, omitSampleId: true })}
      alerts={<TestCardAlerts test={test} variant="escalation" reasonCode={test.reasonCode} />}
      badges={<TestHeaderBadges test={test} variant="escalation" showStatus />}
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
}: EscalationCardSharedData) {
  const { showAttemptIndicator } = rejection;

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
        context={{
          patientName: test.patientName,
          patientId: test.patientId,
          orderId: test.orderId,
          orderTestId: test.id,
          sampleId: test.sampleId,
          entityCode: test.testCode,
          entityName: test.testName,
        }}
        auditLines={testHeaderAudit(test, { includeResultEntered: true, omitSampleId: true })}
        alerts={<TestCardAlerts test={test} variant="escalation" reasonCode={test.reasonCode} />}
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
    deriveSharedData: () => sharedData as EscalationCardSharedData,
    renderMobile: EscalationCardMobile,
    renderDesktop: EscalationCardDesktop,
    isMobile: props.isMobile,
  });
};
