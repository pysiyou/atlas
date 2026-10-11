/**
 * ResultEntryCard — responsive card for result entry (mobile + desktop).
 */

import React, { useMemo } from 'react';
import { actionButtonPreset, Card, IconButton } from '@/components';
import { cn } from '@/utils';
import { usePatientNameLookup } from '@/features/patients';
import { useLabWorkflowCardClickGuard, useOrderTestQueueState } from '../hooks';
import { useLabWorkflowResponsiveCard } from '../hooks/useLabWorkflowResponsiveCard';
import { LabWorkflowCardShell, ProgressMeta } from '../components/LabWorkflowCardShell';
import { TestCardMeta, TestHeaderBadges } from '../components/LabWorkflowBadges';
import { testHeaderAudit } from '../constants/labWorkflowAuditLines';
import { LabMobileCardHeader } from '../components/LabWorkflowMobileHeader';
import { LAB_CONFIG } from '../constants';
import { LAB_MOBILE_CARD } from '../utils/labStyles';
import { deriveRetestContext } from '../utils/deriveRetestContext';
import type { Test, TestWithContext } from '@/types';

export interface ResultEntryCardProps {
  test: TestWithContext;
  testDef: Test | undefined;
  resultKey: string;
  results: Record<string, string>;
  technicianNotes: string;
  isComplete: boolean;
  onResultsChange: (resultKey: string, paramCode: string, value: string) => void;
  onNotesChange: (resultKey: string, notes: string) => void;
  onSave: () => void;
  onClick: () => void;
  isMobile?: boolean;
}

interface ResultEntryCardSharedData {
  test: TestWithContext;
  testDef: Test;
  results: Record<string, string>;
  isComplete: boolean;
  patientName: string;
  parameterCount: number;
  filledCount: number;
  handleCardClick: (e?: React.MouseEvent) => void;
  workItem: ReturnType<typeof useOrderTestQueueState>;
  rejection: ReturnType<typeof deriveRetestContext>;
  canEnter: boolean;
  blockedLabel: string | undefined;
}

function useResultEntryCardData(props: ResultEntryCardProps): ResultEntryCardSharedData | null {
  const { test, testDef, results, isComplete, onClick } = props;
  const { getPatientName } = usePatientNameLookup();
  const workItem = useOrderTestQueueState(test);
  const rejection = useMemo(() => deriveRetestContext(test), [test]);
  const canEnter = test.allowedActions?.enterResults !== false;
  const blockedLabel =
    test.denyMessage ??
    (workItem.blockedReason ? workItem.label : undefined);
  const handleCardClick = useLabWorkflowCardClickGuard(() => {
    if (canEnter) onClick();
  });

  if (!testDef?.parameters) return null;

  const patientName = getPatientName(test.patientId);
  const parameterCount = testDef.parameters.length;
  const filledCount = Object.values(results).filter(v => v?.trim()).length;

  return {
    test,
    testDef,
    results,
    isComplete,
    patientName,
    parameterCount,
    filledCount,
    handleCardClick,
    workItem,
    rejection,
    canEnter,
    blockedLabel,
  };
}

function ResultEntryCardDesktop({
  test,
  testDef,
  results,
  isComplete,
  parameterCount,
  filledCount,
  handleCardClick,
  rejection,
  canEnter,
}: ResultEntryCardSharedData) {
  const { showAttemptIndicator } = rejection;
  const auditLines = useMemo(
    () => testHeaderAudit(test, { omitSampleId: true }),
    [test]
  );

  const previewParams = (testDef.parameters ?? []).slice(0, LAB_CONFIG.PARAMETER_PREVIEW_LIMIT);
  const remainingParams = parameterCount - previewParams.length;

  return (
    <LabWorkflowCardShell
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
      meta={<TestCardMeta test={test} variant="entry" queueSince={test.collectedAt} />}
      badges={<TestHeaderBadges test={test} variant="entry" showStatus />}
      actions={
        <ProgressMeta
          count={filledCount}
          total={parameterCount}
          label="params"
          isComplete={isComplete}
        />
      }
      content={
        <p className="leading-snug">
          {previewParams.map((param, index) => (
            <span key={param.code}>
              {index > 0 ? ' · ' : null}
              <span className={results[param.code]?.trim() ? 'text-text-primary' : 'text-text-tertiary'}>
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
  patientName,
  handleCardClick,
  rejection,
  canEnter,
  blockedLabel,
}: ResultEntryCardSharedData) {
  const { showAttemptIndicator } = rejection;
  const auditLines = useMemo(
    () => testHeaderAudit(test, { omitSampleId: true }),
    [test]
  );

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
        auditLines={auditLines}
        meta={<TestCardMeta test={test} variant="entry" queueSince={test.collectedAt} />}
        badges={<TestHeaderBadges test={test} variant="entry" size="xs" showStatus />}
        actions={
          <IconButton
            {...actionButtonPreset('edit')}
            size="sm"
            title={canEnter ? 'Enter Results' : blockedLabel ?? 'Result entry not allowed'}
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

export const ResultEntryCard: React.FC<ResultEntryCardProps> = props => {
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
