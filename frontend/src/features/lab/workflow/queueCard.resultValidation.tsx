import { useMemo, type FC } from 'react';
import { actionButtonPreset, Button, Card } from '@/components';
import { cn } from '@/utils';
import { TestCardAlerts, TestHeaderBadges } from '../components/LabWorkflowBadges';
import { QualityIssuePopover } from '../components';
import { ResultsParameterGrid } from '../components/ResultsParameterGrid';
import { testHeaderAudit } from '../constants/labWorkflowAuditLines';
import { QueueCard } from './queueCardLayout';
import { QueueCardMobile } from './queueCardLayout';
import { SampleRejectedBanner } from '../components/SampleRejectedBanner';
import { LAB_MOBILE_CARD } from '../utils/labStyles';
import { useLabWorkflowResponsiveCard } from '../hooks/useLabWorkflowResponsiveCard';
import {
  useResultValidationCardData,
  type ResultValidationCardProps,
  type ResultValidationCardSharedData,
} from './queueCard.resultValidation.data';

export type { ResultValidationCardProps } from './queueCard.resultValidation.data';

function ResultValidationCardDesktop({
  test,
  onApprove,
  onReject,
  isApproving,
  handleCardClick,
  sampleRejection,
  rejection,
  canValidate,
  canReject,
}: ResultValidationCardSharedData) {
  const { showAttemptIndicator } = rejection;
  const flagCount = test.flags?.length ?? 0;
  const auditLines = useMemo(
    () => testHeaderAudit(test, { includeResultEntered: true, omitSampleId: true }),
    [test]
  );
  const { showBanner: isSampleRejected, sampleId, sampleRejectionReason } = sampleRejection;

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
      auditLines={auditLines}
      alerts={
        <TestCardAlerts
          test={test}
          variant="validation"
          emphasizeCritical
          queueSince={test.resultEnteredAt}
          flagCount={flagCount}
        />
      }
      badges={<TestHeaderBadges test={test} variant="validation" showStatus />}
      actionsPlacement="header"
      actions={
        <div className="flex items-center gap-space-2">
          <QualityIssuePopover
            orderTestId={test.id!}
            testCode={test.testCode}
            testName={test.testName}
            patientName={test.patientName}
            onReject={onReject}
            disabled={!canReject}
          />
          <Button
            {...actionButtonPreset('approve')}
            size="sm"
            title="Approve Results"
            isLoading={isApproving}
            disabled={!canValidate}
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
      contentTitle="Results"
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
  rejection,
  canValidate,
  canReject,
}: ResultValidationCardSharedData) {
  const { showAttemptIndicator } = rejection;
  const { showBanner: isSampleRejected, sampleId, sampleRejectionReason } = sampleRejection;
  const auditLines = useMemo(
    () => testHeaderAudit(test, { includeResultEntered: true, omitSampleId: true }),
    [test]
  );
  const flagCount = test.flags?.length ?? 0;

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
      {isSampleRejected && (
        <div className="mb-space-2">
          <SampleRejectedBanner
            sampleId={sampleId}
            sampleRejectionReason={sampleRejectionReason}
            size="compact"
          />
        </div>
      )}

      <QueueCardMobile
        context={{
          patientName,
          patientId: test.patientId,
          orderId: test.orderId,
          orderTestId: test.id,
          sampleId: test.sampleId,
          entityCode: test.testCode,
          entityName: test.testName,
        }}
        auditLines={auditLines}
        alerts={
          <TestCardAlerts
            test={test}
            variant="validation"
            emphasizeCritical
            queueSince={test.resultEnteredAt}
            flagCount={flagCount}
          />
        }
        badges={<TestHeaderBadges test={test} variant="validation" size="xs" showStatus />}
        actionsPlacement="header"
        actions={
          <>
            <QualityIssuePopover
              orderTestId={test.id!}
              testCode={test.testCode}
              testName={test.testName}
              patientName={patientName}
              onReject={onReject}
              disabled={!canReject}
            />
            <Button
              {...actionButtonPreset('approve')}
              size="sm"
              title="Approve Results"
              isLoading={isApproving}
              disabled={!canValidate}
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
      </QueueCardMobile>
    </Card>
  );
}

export const ResultValidationCard: FC<ResultValidationCardProps> = props => {
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
