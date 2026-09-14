/**
 * ValidationCardMobile - Mobile layout for result validation workflow
 */

import React from 'react';
import { Button, Card } from '@/components';
import { QualityIssueDialog } from '../../components';
import { TestHeaderBadges } from '../../components/labWorkflowBadges';
import { testHeaderAudit } from '../../components/labHeader';
import { LabMobileCardHeader, labMobileCardSurfaceClassName } from '../../components/labMobileCardHeader';
import { ResultsParameterGrid } from '../../components/ResultsParameterGrid';
import { SpecimenRejectedAlert } from './SpecimenRejectedAlert';
import { cn } from '@/utils';
import type { ValidationCardSharedData } from './hooks';

export const ValidationCardMobile: React.FC<ValidationCardSharedData> = ({
  test,
  patientName,
  onApprove,
  onReject,
  isApproving,
  handleCardClick,
  sampleRejectionReason,
  workItem,
  rejection,
}) => {
  const { showAttemptIndicator } = rejection;
  const isSpecimenRejected = workItem.blockedReason === 'sample_rejected';

  const actions = (
    <>
      <QualityIssueDialog
        orderTestId={test.id!}
        testCode={test.testCode}
        testName={test.testName}
        patientName={patientName}
        onReject={onReject}
      />
      <Button
        variant="approve"
        size="sm"
        title="Approve Results"
        isLoading={isApproving}
        onClick={e => {
          e.stopPropagation();
          onApprove();
        }}
      >
        Approve
      </Button>
    </>
  );

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
      {isSpecimenRejected && (
        <div className="mb-2">
          <SpecimenRejectedAlert
            sampleId={test.sampleId}
            sampleRejectionReason={sampleRejectionReason}
            size="compact"
          />
        </div>
      )}

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
        auditLines={testHeaderAudit(test, { includeResultEntered: true })}
        badges={
          <TestHeaderBadges
            test={test}
            variant="validation"
            size="xs"
            emphasizeCritical
            queueSince={test.resultEnteredAt}
            blockedLabel={workItem.blockedReason ? workItem.label : undefined}
            flagCount={test.flags?.length}
          />
        }
        actions={actions}
      >
        <ResultsParameterGrid
          results={test.results!}
          flags={test.flags}
          variant="inline"
          dense
        />
      </LabMobileCardHeader>
    </Card>
  );
};
