/**
 * Result entry queue card — desktop/mobile shells, left header, data hooks.
 */
/* eslint-disable react-refresh/only-export-components -- queue card + colocated data hook */

import { memo, useMemo, type FC } from 'react';
import { actionButtonPreset, IconButton } from '@/components/primitives';
import { Card } from '@/components/surfaces';
import { cn } from '@/utils';
import { TestHeaderBadges } from '../../components/LabWorkflowBadges';
import { LAB_CONFIG } from '../../constants';
import { useLabWorkflowCardClickGuard, useLabQueueRowState } from '../../hooks';
import { isLabActionAllowed } from '../../utils/queueDisplay';
import { useLabWorkflowResponsiveCard } from '../../hooks/useLabWorkflowResponsiveCard';
import { FG, MOBILE_LIST_CARD } from '@/theme/recipes';
import type { Test } from '@/types';
import { type EntryQueueRow } from '../../types/queues';
import {
  labModalWorkItemFromDto,
  retestContextFromRow,
  type LabOrderTestQueueRow,
} from '../../types/labQueueChrome';
import { QueueCard, QueueCardMobile } from '../shared/queueCardLayout';
import { TestWorkflowCardLeftColumn } from '../shared/queueCardLeftColumn';

export interface ResultEntryCardProps {
  row: EntryQueueRow;
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
  row: EntryQueueRow;
  chromeRow: LabOrderTestQueueRow;
  testDef: Test;
  results: Record<string, string>;
  isComplete: boolean;
  patientName: string;
  parameterCount: number;
  filledCount: number;
  handleCardClick: (e?: React.MouseEvent) => void;
  workItem: ReturnType<typeof useLabQueueRowState>;
  rejection: ReturnType<typeof retestContextFromRow>;
  canEnter: boolean;
  denyTooltipLabel: string | undefined;
}

export function useResultEntryCardData(props: ResultEntryCardProps): ResultEntryCardSharedData | null {
  const { row, testDef, results, isComplete, onClick } = props;
  const chromeRow = useMemo(() => labModalWorkItemFromDto(row), [row]);
  const workItem = useLabQueueRowState(row);
  const rejection = useMemo(() => retestContextFromRow(chromeRow), [chromeRow]);
  const canEnter = isLabActionAllowed(row.allowedActions, 'enterResults');
  const denyTooltipLabel =
    row.denyMessage ?? (!canEnter ? workItem.label : undefined);
  const handleCardClick = useLabWorkflowCardClickGuard(() => {
    if (canEnter) onClick();
  });

  if (!testDef?.parameters) return null;

  const patientName = row.patientName || '—';
  const parameterCount = testDef.parameters.length;
  const filledCount = Object.values(results).filter(v => v?.trim()).length;

  return {
    row,
    chromeRow,
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
  chromeRow: LabOrderTestQueueRow,
  patientName: string,
  testDef: Test,
  filledCount: number,
  parameterCount: number
) {
  const leftColumn = useMemo(
    () => (
      <TestWorkflowCardLeftColumn
        row={chromeRow}
        patientName={patientName}
        variant="entry"
        queueSince={chromeRow.collectedAt ?? undefined}
        filledCount={filledCount}
        parameterCount={parameterCount}
        turnaroundHours={testDef.turnaroundTime}
      />
    ),
    [chromeRow, patientName, testDef.turnaroundTime, filledCount, parameterCount]
  );

  const badges = <TestHeaderBadges row={chromeRow} variant="entry" showStatus />;

  return { leftColumn, badges };
}

function ResultEntryCardDesktop({
  chromeRow,
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
    chromeRow,
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
  chromeRow,
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
    chromeRow,
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
        badges={<TestHeaderBadges row={chromeRow} variant="entry" size="xs" showStatus />}
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
