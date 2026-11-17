/**
 * Result entry queue card — desktop/mobile shells, left header, data hooks.
 */
/* eslint-disable react-refresh/only-export-components -- queue card + colocated data hook */

import React, { memo, useMemo, type FC } from 'react';
import { actionButtonPreset, IconButton } from '@/components/primitives';
import { Card } from '@/components/surfaces';
import { cn } from '@/utils';
import { TestHeaderBadges } from '../../components/LabWorkflowBadges';
import { LAB_CONFIG } from '../../constants';
import { useLabWorkflowCardClickGuard, useLabQueueRowState } from '../../hooks';
import { isLabActionAllowed, labDisabledActionTooltip } from '../../utils/queueDisplay';
import { useLabWorkflowResponsiveCard } from '../../hooks/useLabWorkflowResponsiveCard';
import { FG, MOBILE_LIST_CARD } from '@/theme/recipes';
import type  { OrderableTest } from '@/types';
import { type EntryQueueRow } from '../../types/queues';
import {
  labModalWorkItemFromDto,
  retestContextFromRow,
  type LabOrderTestQueueRow,
} from '../../types/labQueueChrome';
import { QueueCard, QueueCardMobile } from '../shared/QueueCardLayout';
import { TestWorkflowCardLeftColumn } from '../shared/QueueCardLeftColumn';

export interface ResultEntryCardProps {
  row: EntryQueueRow;
  testDef: OrderableTest | undefined;
  resultKey: string;
  results: Record<string, string>;
  technicianNotes: string;
  isComplete: boolean;
  onResultsChange: (resultKey: string, analyteCode: string, value: string) => void;
  onNotesChange: (resultKey: string, notes: string) => void;
  onSave: () => void;
  onClick: () => void;
  isMobile?: boolean;
}

export interface ResultEntryCardSharedData {
  row: EntryQueueRow;
  chromeRow: LabOrderTestQueueRow;
  testDef: OrderableTest;
  results: Record<string, string>;
  isComplete: boolean;
  patientName: string;
  analyteCount: number;
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
  const denyTooltipLabel = !canEnter
    ? labDisabledActionTooltip({ denyMessage: row.denyMessage, fallbackLabel: workItem.label }, row)
    : undefined;
  const handleCardClick = useLabWorkflowCardClickGuard(() => {
    if (canEnter) onClick();
  });

  if (!testDef?.analytes) return null;

  const patientName = row.patientName || '—';
  const analyteCount = testDef.analytes.length;
  const filledCount = Object.values(results).filter(v => v?.trim()).length;

  return {
    row,
    chromeRow,
    testDef,
    results,
    isComplete,
    patientName,
    analyteCount,
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
  testDef: OrderableTest,
  filledCount: number,
  analyteCount: number
) {
  const leftColumn = useMemo(
    () => (
      <TestWorkflowCardLeftColumn
        row={chromeRow}
        patientName={patientName}
        variant="entry"
        queueSince={chromeRow.collectedAt ?? undefined}
        filledCount={filledCount}
        analyteCount={analyteCount}
        turnaroundHours={testDef.turnaroundTimeHours}
      />
    ),
    [chromeRow, patientName, testDef.turnaroundTimeHours, filledCount, analyteCount]
  );

  const badges = <TestHeaderBadges row={chromeRow} variant="entry" showStatus />;

  return { leftColumn, badges };
}

function ResultEntryCardDesktop({
  chromeRow,
  testDef,
  results,
  analyteCount,
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
    analyteCount
  );
  const previewAnalytes = (testDef.analytes ?? []).slice(0, LAB_CONFIG.ANALYTE_PREVIEW_LIMIT);
  const remainingAnalytes = analyteCount - previewAnalytes.length;

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
          {previewAnalytes.map((analyte, index) => (
            <span key={analyte.analyte_code}>
              {index > 0 ? ' · ' : null}
              <span
                className={
                  results[analyte.analyte_code]?.trim() ? FG.body : FG.captionMuted
                }
              >
                {analyte.name}
              </span>
            </span>
          ))}
          {remainingAnalytes > 0 ? (
            <span className={FG.captionMuted}> · +{remainingAnalytes} more</span>
          ) : null}
        </p>
      }
      contentTitle="Results"
    />
  );
}

function ResultEntryCardMobile({
  chromeRow,
  testDef,
  patientName,
  filledCount,
  analyteCount,
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
    analyteCount
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
