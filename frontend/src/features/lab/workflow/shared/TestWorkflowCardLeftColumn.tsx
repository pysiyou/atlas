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
  analyteCount?: number;
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
  referentDoctorName,
  orderId,
  testCode,
  sampleId,
}: {
  patientName: string;
  testName: string;
  referentDoctorName?: string;
  orderId?: string | null;
  testCode: string;
  sampleId?: string | null;
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
  if (sampleId && testCode) {
    if (line1.length > 0) line1.push(<InlineDot key="dot-ot" />);
    line1.push(
      <RecordId
        key="ot"
        type="orderTest"
        value={`${sampleId}/${testCode}`}
        className={idClass}
      />
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
  if (sampleId) {
    if (line2.length > 0) line2.push(<InlineDot key="dot-acc" />);
    line2.push(
      <RecordId key="acc" type="sample" value={sampleId} emphasis="headerMuted" className={idClass} />
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
 * Stage-specific ops chips (queue age, result progress, flags, attempt).
 */
function TestWorkflowOperationsRow({
  variant,
  queueSince,
  emphasizeCritical,
  flagCount,
  reasonCode,
  filledCount,
  analyteCount,
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
  analyteCount?: number;
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
      {variant === 'entry' && analyteCount != null && filledCount != null ? (
        <span>
          {filledCount}/{analyteCount} results
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
  analyteCount,
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
      priorTestDisplay: row.priorTestDisplay,
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
          referentDoctorName={row.referentDoctorName ?? undefined}
          orderId={row.orderId}
          testCode={row.testCode}
          sampleId={row.sampleId}
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
          analyteCount={analyteCount}
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
