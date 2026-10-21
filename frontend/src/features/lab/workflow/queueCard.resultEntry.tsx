/**
 * Result entry queue card — desktop/mobile shells, left header, data hooks.
 */
/* eslint-disable react-refresh/only-export-components -- queue card + colocated data hook */

import { memo, useMemo, type FC } from 'react';
import { actionButtonPreset, IconButton } from '@/components/primitives';
import { Card } from '@/components/surfaces';
import { cn } from '@/utils';
import { TestHeaderBadges } from '../components/LabWorkflowBadges';
import { LAB_CONFIG } from '../constants';
import { useLabWorkflowCardClickGuard, useOrderTestQueueState } from '../hooks';
import { isLabActionAllowed } from '../utils/queueDisplay';
import { useLabWorkflowResponsiveCard } from '../hooks/useLabWorkflowResponsiveCard';
import { deriveRetestContext } from '../utils/deriveRetestContext';
import { FG, MOBILE_LIST_CARD } from '@/theme/recipes';
import type { Test, TestWithContext } from '@/types';
import { QueueCard, QueueCardMobile } from './queueCardLayout';
import { TestWorkflowCardLeftColumn } from './queueCardLeftColumn';

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

export interface ResultEntryCardSharedData {
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
  denyTooltipLabel: string | undefined;
}

export function useResultEntryCardData(props: ResultEntryCardProps): ResultEntryCardSharedData | null {
  const { test, testDef, results, isComplete, onClick } = props;
  const workItem = useOrderTestQueueState(test);
  const rejection = useMemo(() => deriveRetestContext(test), [test]);
  const canEnter = isLabActionAllowed(test.allowedActions, 'enterResults');
  const denyTooltipLabel =
    test.denyMessage ?? (!canEnter ? workItem.label : undefined);
  const handleCardClick = useLabWorkflowCardClickGuard(() => {
    if (canEnter) onClick();
  });

  if (!testDef?.parameters) return null;

  const patientName = test.patientName || '—';
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
    denyTooltipLabel,
  };
}

function useResultEntryCardHeader(
  test: TestWithContext,
  patientName: string,
  testDef: Test,
  filledCount: number,
  parameterCount: number
) {
  const leftColumn = useMemo(
    () => (
      <TestWorkflowCardLeftColumn
        test={test}
        patientName={patientName}
        variant="entry"
        queueSince={test.collectedAt}
        filledCount={filledCount}
        parameterCount={parameterCount}
        turnaroundHours={testDef.turnaroundTime}
      />
    ),
    [test, patientName, testDef.turnaroundTime, filledCount, parameterCount]
  );

  const badges = <TestHeaderBadges test={test} variant="entry" showStatus />;

  return { leftColumn, badges };
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
  patientName,
}: ResultEntryCardSharedData) {
  const { showAttemptIndicator } = rejection;
  const { leftColumn, badges } = useResultEntryCardHeader(
    test,
    patientName,
    testDef,
    filledCount,
    parameterCount
  );
  const previewParams = (testDef.parameters ?? []).slice(0, LAB_CONFIG.PARAMETER_PREVIEW_LIMIT);
  const remainingParams = parameterCount - previewParams.length;

  return (
    <QueueCard
      onClick={canEnter ? handleCardClick : undefined}
      className={cn(
        showAttemptIndicator ? 'border-warning-stroke-emphasis' : '',
        !canEnter && 'opacity-70 cursor-not-allowed'
      )}
      leftColumn={leftColumn}
      badges={badges}
      content={
        <p className="leading-snug">
          {previewParams.map((param, index) => (
            <span key={param.code}>
              {index > 0 ? ' · ' : null}
              <span
                className={
                  results[param.code]?.trim() ? FG.body : FG.captionMuted
                }
              >
                {param.name}
              </span>
            </span>
          ))}
          {remainingParams > 0 ? (
            <span className={FG.captionMuted}> · +{remainingParams} more</span>
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
  const { leftColumn } = useResultEntryCardHeader(
    test,
    patientName,
    testDef,
    filledCount,
    parameterCount
  );

  return (
    <Card
      padding="sm"
      hover={canEnter}
      className={cn(
        MOBILE_LIST_CARD.surface,
        showAttemptIndicator && 'border-warning-stroke-emphasis',
        !canEnter && 'opacity-70 cursor-not-allowed'
      )}
      onClick={canEnter ? handleCardClick : undefined}
    >
      <QueueCardMobile
        leftColumn={leftColumn}
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

function passThroughEntrySharedData(
  data: ResultEntryCardSharedData | null
): ResultEntryCardSharedData {
  return data as ResultEntryCardSharedData;
}

export const ResultEntryCard: FC<ResultEntryCardProps> = memo(props => {
  const sharedData = useResultEntryCardData(props);

  const card = useLabWorkflowResponsiveCard({
    item: sharedData,
    deriveSharedData: passThroughEntrySharedData,
    renderMobile: ResultEntryCardMobile,
    renderDesktop: ResultEntryCardDesktop,
    isMobile: props.isMobile,
  });

  if (!sharedData) return null;

  return card;
});
ResultEntryCard.displayName = 'ResultEntryCard';
