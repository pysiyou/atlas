/**
 * EntryCardMobile - Mobile layout for result entry workflow
 */

import React from 'react';
import { Card, IconButton } from '@/components';
import { TestHeaderBadges } from '../../components/labWorkflowBadges';
import { testHeaderAudit } from '../../components/labHeader';
import { LabMobileCardHeader, labMobileCardSurfaceClassName } from '../../components/labMobileCardHeader';
import { cn } from '@/utils';
import type { EntryCardSharedData } from './hooks';

export const EntryCardMobile: React.FC<EntryCardSharedData> = ({
  test,
  patientName,
  handleCardClick,
  workItem,
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
          patientName,
          patientId: test.patientId,
          orderId: test.orderId,
          orderTestId: test.id,
          sampleId: test.sampleId,
          entityCode: test.testCode,
          entityName: test.testName,
        }}
        auditLines={testHeaderAudit(test)}
        badges={
          <TestHeaderBadges
            test={test}
            variant="entry"
            size="xs"
            queueSince={test.collectedAt}
            blockedLabel={workItem.blockedReason ? workItem.label : undefined}
          />
        }
        actions={
          <IconButton
            variant="edit"
            size="sm"
            title="Enter Results"
            onClick={e => {
              e.stopPropagation();
              handleCardClick();
            }}
          />
        }
      />
    </Card>
  );
};
