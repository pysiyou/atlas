/**
 * ValidationCardDesktop - Desktop layout for result validation workflow
 */

import React from 'react';
import { Button } from '@/components';
import { LabCard } from '../../components/LabCard';
import { TestHeaderBadges } from '../../components/labWorkflowBadges';
import { QualityIssueDialog } from '../../components';
import { ResultsParameterGrid } from '../../components/ResultsParameterGrid';
import { SpecimenRejectedAlert } from './SpecimenRejectedAlert';
import { testHeaderAudit } from '../../components/labHeader';
import type { ValidationCardSharedData } from './hooks';

export const ValidationCardDesktop: React.FC<ValidationCardSharedData> = ({
  test,
  onApprove,
  onReject,
  isApproving,
  handleCardClick,
  sampleRejectionReason,
  workItem,
  rejection,
}) => {
  const { showAttemptIndicator } = rejection;
  const resultCount = Object.keys(test.results!).length;
  const isSpecimenRejected = workItem.blockedReason === 'sample_rejected';

  const badges = (
    <TestHeaderBadges
      test={test}
      variant="validation"
      emphasizeCritical
      queueSince={test.resultEnteredAt}
      blockedLabel={workItem.blockedReason ? workItem.label : undefined}
      flagCount={test.flags?.length}
    />
  );

  const actions = (
    <div className="flex items-center gap-2 z-10" onClick={e => e.stopPropagation()}>
      <QualityIssueDialog
        orderTestId={test.id!}
        testCode={test.testCode}
        testName={test.testName}
        patientName={test.patientName}
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
    </div>
  );

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
      badges={badges}
      actions={actions}
      content={
        <>
          {isSpecimenRejected && (
            <div className="mb-3">
              <SpecimenRejectedAlert
                sampleId={test.sampleId}
                sampleRejectionReason={sampleRejectionReason}
              />
            </div>
          )}
          <ResultsParameterGrid results={test.results!} flags={test.flags} variant="inline" />
        </>
      }
      contentTitle={`Results (${resultCount})`}
    />
  );
};
