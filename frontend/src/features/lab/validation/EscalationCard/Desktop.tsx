/**
 * EscalationCardDesktop - Desktop layout for escalated tests
 */

import React from 'react';
import { Button, Icon } from '@/components';
import { LabCard } from '../../components/LabCard';
import { TestHeaderBadges } from '../../components/labWorkflowBadges';
import { testHeaderAudit } from '../../components/labHeader';
import { ICONS } from '@/config/icons';
import type { EscalationCardSharedData } from './hooks';

export const EscalationCardDesktop: React.FC<EscalationCardSharedData> = ({
  test,
  onClick,
  handleCardClick,
  rejection,
  blockedLabel,
}) => {
  const { showAttemptIndicator } = rejection;

  return (
    <LabCard
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
        <div className="flex items-center gap-2 z-10" onClick={e => e.stopPropagation()}>
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
        <div className="text-xs text-text-secondary">
          {test.reasonCode && (
            <span>
              <span className="text-text-tertiary">Reason:</span> {test.reasonCode}
            </span>
          )}
        </div>
      }
      contentTitle="Details"
    />
  );
};
