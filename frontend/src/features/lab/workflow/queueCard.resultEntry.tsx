import { useMemo, type FC } from 'react';
import { actionButtonPreset, Card, IconButton } from '@/components';
import { cn } from '@/utils';
import { TestCardAlerts, TestHeaderBadges } from '../components/LabWorkflowBadges';
import { LabCardMetaRow } from '../components/LabCardMetaRow';
import { testHeaderAudit } from '../constants/labWorkflowAuditLines';
import { QueueCard } from './queueCardLayout';
import type { TestWithContext } from '@/types';
import { QueueCardMobile } from './queueCardLayout';
import { LAB_CONFIG } from '../constants';
import { LAB_MOBILE_CARD } from '../utils/labStyles';
import { useLabWorkflowResponsiveCard } from '../hooks/useLabWorkflowResponsiveCard';
import {
  useResultEntryCardData,
  type ResultEntryCardProps,
  type ResultEntryCardSharedData,
} from './queueCard.resultEntry.data';

export type { ResultEntryCardProps } from './queueCard.resultEntry.data';

export function ResultEntryCardAlerts({
  test,
  filledCount,
  parameterCount,
  turnaroundTime,
}: {
  test: TestWithContext;
  filledCount: number;
  parameterCount: number;
  turnaroundTime?: number;
}) {
  const showTurnaroundTime =
    typeof turnaroundTime === 'number' && Number.isFinite(turnaroundTime) && turnaroundTime > 0;

  return (
    <>
      <TestCardAlerts test={test} variant="entry" queueSince={test.collectedAt} />
      <LabCardMetaRow>
        <span>
          {filledCount}/{parameterCount} parameters
        </span>
        {showTurnaroundTime ? <span>{turnaroundTime}h turnaround</span> : null}
      </LabCardMetaRow>
    </>
  );
}

function ResultEntryCardDesktop({
  test,
  testDef,
  results,
  parameterCount,
  filledCount,
  handleCardClick,
  rejection,
  canEnter,
}: ResultEntryCardSharedData) {
  const { showAttemptIndicator } = rejection;
  const auditLines = useMemo(() => testHeaderAudit(test), [test]);
  const turnaroundTime = testDef.turnaroundTime;
  const previewParams = (testDef.parameters ?? []).slice(0, LAB_CONFIG.PARAMETER_PREVIEW_LIMIT);
  const remainingParams = parameterCount - previewParams.length;

  return (
    <QueueCard
      onClick={canEnter ? handleCardClick : undefined}
      className={cn(
        showAttemptIndicator ? 'border-warning-stroke-emphasis' : '',
        !canEnter && 'opacity-70 cursor-not-allowed'
      )}
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
        <ResultEntryCardAlerts
          test={test}
          filledCount={filledCount}
          parameterCount={parameterCount}
          turnaroundTime={turnaroundTime}
        />
      }
      badges={<TestHeaderBadges test={test} variant="entry" showStatus />}
      content={
        <p className="leading-snug">
          {previewParams.map((param, index) => (
            <span key={param.code}>
              {index > 0 ? ' · ' : null}
              <span
                className={
                  results[param.code]?.trim() ? 'text-text-primary' : 'text-text-tertiary'
                }
              >
                {param.name}
              </span>
            </span>
          ))}
          {remainingParams > 0 ? (
            <span className="text-text-tertiary"> · +{remainingParams} more</span>
          ) : null}
        </p>
      }
      contentTitle="Parameters"
    />
  );
}

function ResultEntryCardMobile({
  test,
  testDef,
  patientName,
  filledCount,
  parameterCount,
  handleCardClick,
  rejection,
  canEnter,
  denyTooltipLabel,
}: ResultEntryCardSharedData) {
  const { showAttemptIndicator } = rejection;
  const auditLines = useMemo(() => testHeaderAudit(test), [test]);

  return (
    <Card
      padding="sm"
      hover={canEnter}
      className={cn(
        LAB_MOBILE_CARD.surface,
        showAttemptIndicator && 'border-warning-stroke-emphasis',
        !canEnter && 'opacity-70 cursor-not-allowed'
      )}
      onClick={canEnter ? handleCardClick : undefined}
    >
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
          <ResultEntryCardAlerts
            test={test}
            filledCount={filledCount}
            parameterCount={parameterCount}
            turnaroundTime={testDef.turnaroundTime}
          />
        }
        badges={<TestHeaderBadges test={test} variant="entry" size="xs" showStatus />}
        actionsPlacement="header"
        actions={
          <IconButton
            {...actionButtonPreset('edit')}
            size="sm"
            title={canEnter ? 'Enter Results' : denyTooltipLabel ?? 'Result entry not allowed'}
            disabled={!canEnter}
            onClick={e => {
              e.stopPropagation();
              if (!canEnter) return;
              handleCardClick();
            }}
          />
        }
      />
    </Card>
  );
}

export const ResultEntryCard: FC<ResultEntryCardProps> = props => {
  const sharedData = useResultEntryCardData(props);

  const card = useLabWorkflowResponsiveCard({
    item: props,
    deriveSharedData: () => sharedData as ResultEntryCardSharedData,
    renderMobile: ResultEntryCardMobile,
    renderDesktop: ResultEntryCardDesktop,
    isMobile: props.isMobile,
  });

  if (!sharedData) return null;

  return card;
};
