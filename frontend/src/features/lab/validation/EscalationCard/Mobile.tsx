/**
 * EscalationCardMobile - Mobile layout for escalated tests
 */

import React from 'react';
import { Button, Card, Icon } from '@/components';
import { TestHeaderBadges } from '../../components/labWorkflowBadges';
import { testHeaderAudit } from '../../components/labHeader';
import { LabMobileCardHeader, labMobileCardSurfaceClassName } from '../../components/labMobileCardHeader';
import { cn } from '@/utils';
import { ICONS } from '@/config/icons';
import type { EscalationCardSharedData } from './hooks';

export const EscalationCardMobile: React.FC<EscalationCardSharedData> = ({
  test,
  onClick,
  handleCardClick,
  blockedLabel,
  rejection,
}) => {
  const { showAttemptIndicator } = rejection;

  return (
    <Card
      padding="list"
      hover
      className={cn(
        labMobileCardSurfaceClassName(),
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
};
