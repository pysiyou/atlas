/**
 * ValidationCard — responsive card for result validation (mobile + desktop).
 */

import React, { useMemo } from 'react';
import { Alert, Button, Card, EntityId } from '@/components';
import { cn } from '@/utils';
import { useUserLookup } from '@/lib/api/users.api';
import { usePatientNameLookup } from '@/features/patients';
import { useSampleLookup } from '../api/samples.api';
import { useLabCardClickGuard, useTestWorkItemState } from '@/features/lab/hooks';
import { useResponsiveCard } from '../components/useResponsiveCard';
import { LabCard } from '../components/LabCard';
import { TestHeaderBadges } from '../components/labWorkflowBadges';
import { QualityIssueDialog } from '../components';
import { ResultsParameterGrid } from '../components/ResultsParameterGrid';
import { testHeaderAudit } from '../components/labHeaderAudit';
import { LabMobileCardHeader } from '../components/labMobileCardHeader';
import { LAB_COPY } from '../constants/labCopy';
import { deriveRetestContext } from '../utils/deriveRetestContext';
import { formatRejectionReasons } from '../utils/labFormatters';
import { LAB_MOBILE_CARD } from '../utils/labStyles';
import type { TestWithContext, Sample } from '@/types';
import type { QualityIssueResult } from '@/types/lab-operations';

export interface ValidationCardProps {
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

interface ValidationCardSharedData {
  test: TestWithContext;
  patientName: string;
  onApprove: () => void;
  onReject: (result: QualityIssueResult) => void;
  isApproving: boolean;
  handleCardClick: () => void;
  getUserName: (id: string) => string;
  sampleRejectionReason?: string;
  workItem: ReturnType<typeof useTestWorkItemState>;
  rejection: ReturnType<typeof deriveRetestContext>;
}

function getSampleRejectionReason(
  test: TestWithContext,
  getSample: (sampleId: number) => Sample | undefined
): string | undefined {
  if (!test.sampleId) return undefined;
  const sample = getSample(test.sampleId);
  if (sample?.status !== 'rejected') return undefined;
  return formatRejectionReasons(sample.rejectionReasons) ?? undefined;
}

function SampleRejectedAlert({
  sampleId,
  sampleRejectionReason,
  size = 'default',
}: {
  sampleId?: number;
  sampleRejectionReason?: string;
  size?: 'default' | 'compact';
}) {
  if (!sampleId) return null;

  const isCompact = size === 'compact';

  return (
    <Alert variant="warning" className={isCompact ? 'py-1.5' : 'py-2'}>
      <div className="space-y-1">
        <div>
          <p className={`font-semibold ${isCompact ? 'text-xxs' : 'text-xs'}`}>
            {LAB_COPY.quality.sampleRejected} — Validator Decision Required
          </p>
          <p className={`text-text-secondary leading-tight mt-0.5 ${isCompact ? 'text-xxs' : 'text-xs'}`}>
            {LAB_COPY.entity.sample} <EntityId type="sample" value={sampleId} /> was rejected
            {sampleRejectionReason && (
              <>
                : <span className="italic">{sampleRejectionReason}</span>
              </>
            )}
          </p>
        </div>
        <div className={`space-y-0.5 ${isCompact ? 'text-xxs' : 'text-xs'} text-text-tertiary leading-tight`}>
          <p>This result was entered before sample rejection.</p>
          <p className="font-medium">
            You may still approve this result (clinical judgment) or choose another action:
          </p>
          <ul className="list-disc list-inside pl-2 space-y-0.5 mt-1">
            <li>Approve result (add validation notes explaining decision)</li>
            <li>Request recollection with new sample</li>
            <li>Cancel this test</li>
          </ul>
        </div>
      </div>
    </Alert>
  );
}

function useValidationCardData(props: ValidationCardProps): ValidationCardSharedData | null {
  const { test, onApprove, onReject, onClick, isApproving = false } = props;
  const { getUserName } = useUserLookup();
  const { getPatientName } = usePatientNameLookup();
  const { getSample } = useSampleLookup();
  const handleCardClick = useLabCardClickGuard(onClick);
  const workItem = useTestWorkItemState(test);
  const rejection = useMemo(() => deriveRetestContext(test), [test]);

  if (!test.results) return null;

  const patientName = getPatientName(test.patientId);
  const sampleRejectionReason = getSampleRejectionReason(test, getSample);

  return {
    test,
    patientName,
    onApprove,
    onReject,
    isApproving,
    handleCardClick,
    getUserName,
    sampleRejectionReason,
    workItem,
    rejection,
  };
}

function ValidationCardDesktop({
  test,
  onApprove,
  onReject,
  isApproving,
  handleCardClick,
  sampleRejectionReason,
  workItem,
  rejection,
}: ValidationCardSharedData) {
  const { showAttemptIndicator } = rejection;
  const resultCount = Object.keys(test.results!).length;
  const isSampleRejected = workItem.blockedReason === 'sample_rejected';

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
          variant="validation"
          emphasizeCritical
          queueSince={test.resultEnteredAt}
          blockedLabel={workItem.blockedReason ? workItem.label : undefined}
          flagCount={test.flags?.length}
        />
      }
      actions={
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
      }
      content={
        <>
          {isSampleRejected && (
            <div className="mb-3">
              <SampleRejectedAlert
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
}

function ValidationCardMobile({
  test,
  patientName,
  onApprove,
  onReject,
  isApproving,
  handleCardClick,
  sampleRejectionReason,
  workItem,
  rejection,
}: ValidationCardSharedData) {
  const { showAttemptIndicator } = rejection;
  const isSampleRejected = workItem.blockedReason === 'sample_rejected';

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
        <div className="mb-2">
          <SampleRejectedAlert
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
        actions={
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
        }
      >
        <ResultsParameterGrid results={test.results!} flags={test.flags} variant="inline" dense />
      </LabMobileCardHeader>
    </Card>
  );
}

export const ValidationCard: React.FC<ValidationCardProps> = props => {
  const sharedData = useValidationCardData(props);

  const card = useResponsiveCard({
    item: props,
    deriveSharedData: () => sharedData as ValidationCardSharedData,
    renderMobile: ValidationCardMobile,
    renderDesktop: ValidationCardDesktop,
    isMobile: props.isMobile,
  });

  if (!sharedData) return null;

  return card;
};
