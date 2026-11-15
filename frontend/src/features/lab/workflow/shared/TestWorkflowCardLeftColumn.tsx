/**
 * Left column for result-entry, validation, and escalation queue cards / detail modals.
 */

import { type ReactNode } from 'react';
import { cn } from '@/utils';
import { RecordId } from '@/features/shared';
import { buildTestQueueTimelineLines } from '../../constants/labWorkflowAuditLines';
import type { LabOrderTestQueueRow } from '../../types/labQueueChrome';
import { retestContextFromRow } from '../../types/labQueueChrome';
import { LabWorkflowLeftColumn } from '../../components/LabWorkflowLeftColumn';
import { LabCardMetaRow, QueueAgeMeta } from '../../components/LabCardMetaRow';
import { IDENTITY_INLINE, IDENTITY_STACK } from '@/theme/recipes';

function InlineDot() {
  return (
    <span className={IDENTITY_INLINE.separator}>{IDENTITY_INLINE.inlineDot}</span>
  );
}

export type TestWorkflowCardVariant = 'entry' | 'validation' | 'escalation';

export interface TestWorkflowCardLeftColumnProps {
  row: LabOrderTestQueueRow;
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

/**
 * Two-line identity: patient + test + TST on the first line; doctor, order, sample, code on the second.
 */
function TestWorkflowIdentityLines({
  patientName,
  testName,
  orderTestId,
  referentDoctorName,
  orderId,
  sampleId,
  testCode,
  accessionNumber,
}: {
  patientName: string;
  testName: string;
  orderTestId?: number;
  referentDoctorName?: string;
  orderId: number;
  sampleId?: number;
  testCode: string;
  accessionNumber?: string | null;
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
  if (referentDoctorName) {
    line2.push(
      <span
        key="phys"
        className={cn(IDENTITY_STACK.secondaryText, 'min-w-0 truncate')}
      >
        {referentDoctorName}
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
  if (accessionNumber) {
    if (line2.length > 0) line2.push(<InlineDot key="dot-acc" />);
    line2.push(
      <span key="acc" className={cn(IDENTITY_STACK.secondaryText, idClass)}>
        {accessionNumber}
      </span>
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

/**
 * Stage-specific ops chips (queue age, parameters, flags, attempt).
 */
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

/**
 * Test-workflow left column: two-line identity, ops row, collection/entry audit.
 */
export function TestWorkflowCardLeftColumn({
  row,
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
  const rejection = retestContextFromRow(row);
  const timelineLines = buildTestQueueTimelineLines(
    {
      collectedAt: row.collectedAt ?? undefined,
      collectedBy: row.collectedBy ?? undefined,
      resultEnteredAt: row.resultEnteredAt ?? undefined,
      enteredBy: row.enteredBy ?? undefined,
      retestOfTestId: row.retestOfTestId,
      sampleOriginalSampleId: row.sampleOriginalSampleId,
    },
    { includeResultEntered }
  );

  return (
    <LabWorkflowLeftColumn
      className={className}
      tone={tone}
      identity={
        <TestWorkflowIdentityLines
          patientName={patientName}
          testName={row.testName}
          orderTestId={row.orderTestId}
          referentDoctorName={row.referentDoctorName ?? undefined}
          orderId={row.orderId}
          sampleId={row.sampleId ?? undefined}
          testCode={row.testCode}
          accessionNumber={'accessionNumber' in row ? (row.accessionNumber as string | undefined) : undefined}
        />
      }
      alerts={
        <TestWorkflowOperationsRow
          variant={variant}
          queueSince={queueSince}
          emphasizeCritical={emphasizeCritical && !!row.hasCriticalValues}
          flagCount={flagCount}
          reasonCode={reasonCode}
          filledCount={filledCount}
          parameterCount={parameterCount}
          turnaroundHours={turnaroundHours}
          attemptNumber={rejection.attemptNumber}
          attemptMax={rejection.attemptMax}
          showAttempt={rejection.showAttemptIndicator}
        />
      }
      auditLines={timelineLines}
    />
  );
}
