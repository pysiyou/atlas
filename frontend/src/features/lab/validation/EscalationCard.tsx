/**
 * EscalationCard — responsive card for escalated tests (mobile + desktop).
 */

import React, { useMemo } from 'react';
import { Button, Card, Icon } from '@/components';
import { cn } from '@/utils';
import { ICONS } from '@/config/icons';
import { useUserLookup } from '@/lib/api/users';
import { useLabWorkflowCardClickGuard, useOrderTestQueueState } from '@/features/lab/hooks';
import { useLabWorkflowResponsiveCard } from '../hooks/useLabWorkflowResponsiveCard';
import { LabWorkflowCardShell } from '../components/LabWorkflowCardShell';
import { TestHeaderBadges } from '../components/LabWorkflowBadges';
import { testHeaderAudit } from '../constants/labWorkflowAuditLines';
import { LabMobileCardHeader } from '../components/LabWorkflowMobileHeader';
import { LAB_CARD_TYPOGRAPHY, LAB_MOBILE_CARD } from '../utils/labStyles';
import { deriveRetestContext } from '../utils/deriveRetestContext';
import type { TestWithContext } from '@/types';

export interface EscalationCardProps {
  test: TestWithContext;
  onClick: () => void;
  isMobile?: boolean;
}

interface EscalationCardSharedData {
  test: TestWithContext;
  onClick: () => void;
  handleCardClick: (e?: React.MouseEvent) => void;
  getUserName: (userId: string) => string;
  rejection: ReturnType<typeof deriveRetestContext>;
  blockedLabel?: string;
  isRetest: boolean;
  hasRejectionHistory: boolean;
}

function useEscalationCardData(props: EscalationCardProps): EscalationCardSharedData {
  const { test, onClick } = props;
  const { getUserName } = useUserLookup();
  const handleCardClick = useLabWorkflowCardClickGuard(onClick);
  const workItem = useOrderTestQueueState(test);
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

function EscalationCardDesktop({
  test,
  onClick,
  handleCardClick,
  rejection,
  blockedLabel,
}: EscalationCardSharedData) {
  const { showAttemptIndicator } = rejection;

  return (
    <LabWorkflowCardShell
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
      auditLines={testHeaderAudit(test, { includeResultEntered: true })}
      badges={
        <TestHeaderBadges
          test={test}
          variant="escalation"
          reasonCode={test.reasonCode}
          blockedLabel={blockedLabel}
        />
      }
      actions={
        <div className="flex items-center gap-space-2 z-10" onClick={e => e.stopPropagation()}>
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
      content={
        <div className={LAB_CARD_TYPOGRAPHY.sectionContent}>
          {test.reasonCode && (
            <span>
              <span className={LAB_CARD_TYPOGRAPHY.fieldLabel}>Reason:</span>{' '}
              <span className={LAB_CARD_TYPOGRAPHY.fieldValue}>{test.reasonCode}</span>
            </span>
          )}
        </div>
      }
      contentTitle="Details"
    />
  );
}

function EscalationCardMobile({
  test,
  onClick,
  handleCardClick,
  blockedLabel,
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
      <LabMobileCardHeader
        context={{
          patientName: test.patientName,
          patientId: test.patientId,
          orderId: test.orderId,
          orderTestId: test.id,
          sampleId: test.sampleId,
          entityCode: test.testCode,
          entityName: test.testName,
        }}
        auditLines={testHeaderAudit(test, { includeResultEntered: true })}
        badges={
          <TestHeaderBadges
            test={test}
            variant="escalation"
            size="xs"
            reasonCode={test.reasonCode}
            blockedLabel={blockedLabel}
          />
        }
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

export const EscalationCard: React.FC<EscalationCardProps> = props => {
  const sharedData = useEscalationCardData(props);

  return useLabWorkflowResponsiveCard({
    item: props,
    deriveSharedData: () => sharedData,
    renderMobile: EscalationCardMobile,
    renderDesktop: EscalationCardDesktop,
    isMobile: props.isMobile,
  });
};
