/**
 * Shared left header column for result entry, validation, and escalation queue cards.
 */

import { type ReactNode } from 'react';
import { cn } from '@/utils';
import { RecordId } from '@/features/shared/components';
import type { TestWithContext } from '@/types';
import { buildTestQueueTimelineLines } from '../constants/labWorkflowAuditLines';
import { LabAuditBlock } from '../components/LabWorkflowHeader.parts';
import { LabCardMetaRow, QueueAgeMeta } from '../components/LabCardMetaRow';
import { deriveRetestContext } from '../utils/deriveRetestContext';
import {
  WORKLIST_CARD_ALERT,
  IDENTITY_INLINE,
  CARD_HEADER_GRID,
  IDENTITY_STACK,
} from '@/theme/recipes';

function InlineDot() {
  return (
    <span className={IDENTITY_INLINE.separator}>{IDENTITY_INLINE.inlineDot}</span>
  );
}

export type TestWorkflowCardVariant = 'entry' | 'validation' | 'escalation';

export interface TestWorkflowCardLeftColumnProps {
  test: TestWithContext;
  patientName: string;
  variant: TestWorkflowCardVariant;
  queueSince?: string;
  emphasizeCritical?: boolean;
  flagCount?: number;
  reasonCode?: string;
  filledCount?: number;
  parameterCount?: number;
  turnaroundHours?: number;
  includeResultEntered?: boolean;
  tone?: 'card' | 'modal';
  className?: string;
}

function TestWorkflowIdentityLines({
  patientName,
  testName,
  orderTestId,
  referringPhysician,
  orderId,
  sampleId,
  testCode,
}: {
  patientName: string;
  testName: string;
  orderTestId?: number;
  referringPhysician?: string;
  orderId: number;
  sampleId?: number;
  testCode: string;
}) {
  const idClass = 'whitespace-nowrap';

  const line1: ReactNode[] = [];
  if (patientName) {
    line1.push(
      <span key="patient" className={cn(IDENTITY_INLINE.primaryText, 'min-w-0 truncate')}>
        {patientName}
      </span>
    );
  }
  if (testName) {
    if (line1.length > 0) line1.push(<InlineDot key="dot-name" />);
    line1.push(
      <span
        key="test"
        className={cn(IDENTITY_INLINE.primaryText, 'min-w-0 truncate normal-case')}
        title={testName}
      >
        {testName}
      </span>
    );
  }
  if (orderTestId != null) {
    if (line1.length > 0) line1.push(<InlineDot key="dot-tst" />);
    line1.push(
      <RecordId key="tst" type="orderTest" value={orderTestId} className={idClass} />
    );
  }

  const line2: ReactNode[] = [];
  if (referringPhysician) {
    line2.push(
      <span
        key="phys"
        className={cn(IDENTITY_STACK.secondaryText, 'min-w-0 truncate')}
      >
        {referringPhysician}
      </span>
    );
  }
  if (orderId) {
    if (line2.length > 0) line2.push(<InlineDot key="dot-ord" />);
    line2.push(
      <RecordId key="ord" type="order" value={orderId} emphasis="headerMuted" className={idClass} />
    );
  }
  if (sampleId != null) {
    if (line2.length > 0) line2.push(<InlineDot key="dot-sam" />);
    line2.push(
      <RecordId key="sam" type="sample" value={sampleId} emphasis="headerMuted" className={idClass} />
    );
  }
  if (testCode) {
    if (line2.length > 0) line2.push(<InlineDot key="dot-code" />);
    line2.push(<RecordId key="code" emphasis="headerMuted" className={idClass}>{testCode}</RecordId>);
  }

  return (
    <div className="flex min-w-0 flex-col gap-space-0-5">
      <div className={cn(IDENTITY_STACK.primaryLine, 'min-w-0')}>{line1}</div>
      {line2.length > 0 ? (
        <div className={cn(IDENTITY_STACK.secondaryLine, 'min-w-0')}>{line2}</div>
      ) : null}
    </div>
  );
}

function TestWorkflowOperationsRow({
  variant,
  queueSince,
  emphasizeCritical,
  flagCount,
  reasonCode,
  filledCount,
  parameterCount,
  turnaroundHours,
  attemptNumber,
  attemptMax,
  showAttempt,
}: {
  variant: TestWorkflowCardVariant;
  queueSince?: string;
  emphasizeCritical?: boolean;
  flagCount?: number;
  reasonCode?: string;
  filledCount?: number;
  parameterCount?: number;
  turnaroundHours?: number;
  attemptNumber: number;
  attemptMax: number;
  showAttempt: boolean;
}) {
  const showTurnaround =
    typeof turnaroundHours === 'number' && Number.isFinite(turnaroundHours) && turnaroundHours > 0;

  return (
    <LabCardMetaRow>
      {queueSince ? <QueueAgeMeta since={queueSince} /> : null}
      {variant === 'entry' && parameterCount != null && filledCount != null ? (
        <span>
          {filledCount}/{parameterCount} parameters
        </span>
      ) : null}
      {variant === 'entry' && showTurnaround ? <span>{turnaroundHours}h turnaround</span> : null}
      {variant === 'validation' && emphasizeCritical ? (
        <span className="text-danger-fg font-normal">Critical values</span>
      ) : null}
      {variant === 'validation' && flagCount != null && flagCount > 0 ? (
        <span>{flagCount} flag{flagCount !== 1 ? 's' : ''}</span>
      ) : null}
      {variant === 'escalation' && reasonCode ? <span>Reason: {reasonCode}</span> : null}
      {showAttempt ? (
        <span className={attemptNumber >= attemptMax - 1 ? 'text-warning-fg' : undefined}>
          Attempt {attemptNumber}/{attemptMax}
        </span>
      ) : null}
    </LabCardMetaRow>
  );
}

export function TestWorkflowCardLeftColumn({
  test,
  patientName,
  variant,
  queueSince,
  emphasizeCritical,
  flagCount,
  reasonCode,
  filledCount,
  parameterCount,
  turnaroundHours,
  includeResultEntered = false,
  tone = 'card',
  className,
}: TestWorkflowCardLeftColumnProps) {
  const rejection = deriveRetestContext(test);
  const timelineLines = buildTestQueueTimelineLines(
    {
      collectedAt: test.collectedAt,
      collectedBy: test.collectedBy,
      resultEnteredAt: test.resultEnteredAt,
      enteredBy: test.enteredBy,
      retestOfTestId: test.retestOfTestId,
      sampleOriginalSampleId: test.sampleOriginalSampleId,
    },
    { includeResultEntered }
  );

  return (
    <div className={cn(CARD_HEADER_GRID.leftColumn, className)}>
      <TestWorkflowIdentityLines
        patientName={patientName}
        testName={test.testName}
        orderTestId={test.id}
        referringPhysician={test.referringPhysician}
        orderId={test.orderId}
        sampleId={test.sampleId}
        testCode={test.testCode}
      />
      <div className={WORKLIST_CARD_ALERT.row}>
        <TestWorkflowOperationsRow
          variant={variant}
          queueSince={queueSince}
          emphasizeCritical={emphasizeCritical && test.hasCriticalValues}
          flagCount={flagCount}
          reasonCode={reasonCode}
          filledCount={filledCount}
          parameterCount={parameterCount}
          turnaroundHours={turnaroundHours}
          attemptNumber={rejection.attemptNumber}
          attemptMax={rejection.attemptMax}
          showAttempt={rejection.showAttemptIndicator}
        />
      </div>
      {timelineLines.length > 0 ? (
        <LabAuditBlock lines={timelineLines} compact tone={tone} />
      ) : null}
    </div>
  );
}
