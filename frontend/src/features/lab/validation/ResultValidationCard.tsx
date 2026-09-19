/**
 * ResultValidationCard — responsive card for result validation (mobile + desktop).
 */

import React, { useMemo } from 'react';
import { Button, Card } from '@/components';
import { cn } from '@/utils';
import { useUserLookup } from '@/lib/api/users';
import { usePatientNameLookup } from '@/features/patients';
import { useLabWorkflowCardClickGuard, useOrderTestQueueState } from '@/features/lab/hooks';
import { useLabWorkflowResponsiveCard } from '../hooks/useLabWorkflowResponsiveCard';
import { LabWorkflowCardShell } from '../components/LabWorkflowCardShell';
import { TestHeaderBadges } from '../components/LabWorkflowBadges';
import { QualityIssuePopover } from '../components';
import { ResultsParameterGrid } from '../components/ResultsParameterGrid';
import { testHeaderAudit } from '../constants/labWorkflowAuditLines';
import { LabMobileCardHeader } from '../components/LabWorkflowMobileHeader';
import { deriveRetestContext } from '../utils/deriveRetestContext';
import { SampleRejectedBanner } from '../components/SampleRejectedBanner';
import { useSampleRejectionDisplay } from '../hooks/useSampleRejectionDisplay';
import { LAB_MOBILE_CARD } from '../utils/labStyles';
import type { TestWithContext } from '@/types';
import type { QualityIssueResult } from '@/types/lab-operations';

export interface ResultValidationCardProps {
  test: TestWithContext;
  commentKey: string;
  comments: string;
  onCommentsChange: (commentKey: string, value: string) => void;
  onApprove: () => void;
  onReject: (result: QualityIssueResult) => void;
  onClick: () => void;
  isApproving?: boolean;
  isMobile?: boolean;
}

interface ResultValidationCardSharedData {
  test: TestWithContext;
  patientName: string;
  onApprove: () => void;
  onReject: (result: QualityIssueResult) => void;
  isApproving: boolean;
  handleCardClick: () => void;
  getUserName: (id: string) => string;
  sampleRejection: ReturnType<typeof useSampleRejectionDisplay>;
  workItem: ReturnType<typeof useOrderTestQueueState>;
  rejection: ReturnType<typeof deriveRetestContext>;
}

function useResultValidationCardData(props: ResultValidationCardProps): ResultValidationCardSharedData | null {
  const { test, onApprove, onReject, onClick, isApproving = false } = props;
  const { getUserName } = useUserLookup();
  const { getPatientName } = usePatientNameLookup();
  const handleCardClick = useLabWorkflowCardClickGuard(onClick);
  const workItem = useOrderTestQueueState(test);
  const rejection = useMemo(() => deriveRetestContext(test), [test]);
  const sampleRejection = useSampleRejectionDisplay(test);

  if (!test.results) return null;

  const patientName = getPatientName(test.patientId);

  return {
    test,
    patientName,
    onApprove,
    onReject,
    isApproving,
    handleCardClick,
    getUserName,
    sampleRejection,
    workItem,
    rejection,
  };
}

function ResultValidationCardDesktop({
  test,
  onApprove,
  onReject,
  isApproving,
  handleCardClick,
  sampleRejection,
  workItem,
  rejection,
}: ResultValidationCardSharedData) {
  const { showAttemptIndicator } = rejection;
  const resultCount = Object.keys(test.results!).length;
  const { showBanner: isSampleRejected, sampleId, sampleRejectionReason } = sampleRejection;

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
          variant="validation"
          emphasizeCritical
          queueSince={test.resultEnteredAt}
          blockedLabel={workItem.blockedReason ? workItem.label : undefined}
          flagCount={test.flags?.length}
        />
      }
      actions={
        <div className="flex items-center gap-space-2 z-10" onClick={e => e.stopPropagation()}>
          <QualityIssuePopover
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
      }
      content={
        <>
          {isSampleRejected && (
            <div className="mb-space-3">
              <SampleRejectedBanner sampleId={sampleId} sampleRejectionReason={sampleRejectionReason} />
            </div>
          )}
          <ResultsParameterGrid results={test.results!} flags={test.flags} variant="inline" />
        </>
      }
      contentTitle={`Results (${resultCount})`}
    />
  );
}

function ResultValidationCardMobile({
  test,
  patientName,
  onApprove,
  onReject,
  isApproving,
  handleCardClick,
  sampleRejection,
  workItem,
  rejection,
}: ResultValidationCardSharedData) {
  const { showAttemptIndicator } = rejection;
  const { showBanner: isSampleRejected, sampleId, sampleRejectionReason } = sampleRejection;

  return (
    <Card
      padding="list"
      hover
      className={cn(
        LAB_MOBILE_CARD.surface,
        showAttemptIndicator && 'border-warning-stroke-emphasis'
      )}
      onClick={handleCardClick}
    >
      {isSampleRejected && (
        <div className="mb-space-2">
          <SampleRejectedBanner
            sampleId={sampleId}
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
        actions={
          <>
            <QualityIssuePopover
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
        }
      >
        <ResultsParameterGrid results={test.results!} flags={test.flags} variant="inline" dense />
      </LabMobileCardHeader>
    </Card>
  );
}

export const ResultValidationCard: React.FC<ResultValidationCardProps> = props => {
  const sharedData = useResultValidationCardData(props);

  const card = useLabWorkflowResponsiveCard({
    item: props,
    deriveSharedData: () => sharedData as ResultValidationCardSharedData,
    renderMobile: ResultValidationCardMobile,
    renderDesktop: ResultValidationCardDesktop,
    isMobile: props.isMobile,
  });

  if (!sharedData) return null;

  return card;
};
