/**
 * Queue card left columns — sample collection and test workflow stages.
 */

import { type ReactNode } from 'react';
import { cn, formatDate } from '@/utils';
import { RecordId } from '@/features/shared';
import { type ContainerType, type Sample, type RejectedSample } from '@/types';
import type { ContainerTopColor } from '@/types';
import type { SampleCollectionQueueItem, SampleRequirement } from '@/types/lab-operations';
import type { TestWithContext } from '@/types';
import { buildTestQueueTimelineLines } from '../../constants/labWorkflowAuditLines';
import { LabAuditBlock } from '../../components/LabWorkflowHeader.parts';
import { LabCardMetaRow, QueueAgeMeta } from '../../components/LabCardMetaRow';
import { CollectionOperationalMetaRow } from '../../components/CollectionOperationalMetaItems';
import { buildCollectionOperationalMetaItems } from '../../utils/collectionOperationalMetaItems';
import { buildSampleCollectionTimelineLines } from '../../constants/labWorkflowAuditLines';
import { deriveRetestContext } from '../../utils/deriveRetestContext';
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
  referentDoctorName,
  orderId,
  sampleId,
  testCode,
}: {
  patientName: string;
  testName: string;
  orderTestId?: number;
  referentDoctorName?: string;
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
        referentDoctorName={test.referentDoctorName ?? undefined}
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

export interface SampleCollectionCardLeftColumnProps {
  patientName: string;
  orderId: number;
  referentDoctorName?: string;
  orderDate?: string;
  sample: Sample;
  isPending: boolean;
  isCollected: boolean;
  isRejected: boolean;
  rejectedSample?: RejectedSample | null;
  requiredVolume?: number;
  collectedVolume?: number;
  effectiveContainerType?: ContainerType;
  containerColor?: ContainerTopColor | string;
  colorName?: string;
  collectedAt?: string;
  collectedBy?: string;
  tone?: 'card' | 'modal';
  className?: string;
}

export interface SampleCollectionCardSharedData {
  display: SampleCollectionQueueItem;
  sample: Sample;
  requirement: SampleRequirement;
  onCollect: (
    display: SampleCollectionQueueItem,
    volume: number,
    notes?: string,
    selectedColor?: string,
    containerType?: ContainerType
  ) => void;
  patientName: string;
  testNames: string[];
  handleCardClick: (e?: React.MouseEvent) => void;
  isCollecting: boolean;
}

function SampleCollectionIdentityLines({
  patientName,
  sampleId,
  orderId,
  referentDoctorName,
  orderDate,
}: {
  patientName: string;
  sampleId: number;
  orderId: number;
  referentDoctorName?: string;
  orderDate?: string;
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
  line1.push(<InlineDot key="dot-sam" />);
  line1.push(<RecordId key="sam" type="sample" value={sampleId} className={idClass} />);

  const line2: ReactNode[] = [];
  if (referentDoctorName) {
    line2.push(
      <span key="phys" className={cn(IDENTITY_STACK.secondaryText, 'min-w-0 truncate')}>
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
  if (orderDate) {
    if (line2.length > 0) line2.push(<InlineDot key="dot-date" />);
    line2.push(
      <span key="date" className={IDENTITY_STACK.secondaryDate}>
        {formatDate(orderDate)}
      </span>
    );
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

function SampleCollectionOperationsRow(
  props: Pick<
    SampleCollectionCardLeftColumnProps,
    | 'sample'
    | 'isPending'
    | 'isCollected'
    | 'isRejected'
    | 'rejectedSample'
    | 'orderDate'
    | 'requiredVolume'
    | 'collectedVolume'
    | 'effectiveContainerType'
    | 'containerColor'
    | 'colorName'
  >
) {
  const items = buildCollectionOperationalMetaItems(props);

  return <CollectionOperationalMetaRow items={items} />;
}

export function SampleCollectionCardLeftColumn({
  patientName,
  orderId,
  referentDoctorName,
  orderDate,
  sample,
  isPending,
  isCollected,
  isRejected,
  rejectedSample = null,
  requiredVolume,
  collectedVolume,
  effectiveContainerType,
  containerColor,
  colorName,
  collectedAt,
  collectedBy,
  tone = 'card',
  className,
}: SampleCollectionCardLeftColumnProps) {
  const timelineLines = buildSampleCollectionTimelineLines({
    collectedAt,
    collectedBy,
    isRecollection: sample.isRecollection,
    originalSampleId: sample.originalSampleId,
    originalSampleCollectedAt: sample.originalSampleCollectedAt,
  });

  return (
    <div className={cn(CARD_HEADER_GRID.leftColumn, className)}>
      <SampleCollectionIdentityLines
        patientName={patientName}
        sampleId={sample.sampleId}
        orderId={orderId}
        referentDoctorName={referentDoctorName}
        orderDate={orderDate}
      />
      <div className={WORKLIST_CARD_ALERT.row}>
        <SampleCollectionOperationsRow
          sample={sample}
          isPending={isPending}
          isCollected={isCollected}
          isRejected={isRejected}
          rejectedSample={rejectedSample}
          orderDate={orderDate}
          requiredVolume={requiredVolume}
          collectedVolume={collectedVolume}
          effectiveContainerType={effectiveContainerType}
          containerColor={containerColor}
          colorName={colorName}
        />
      </div>
      {timelineLines.length > 0 ? (
        <LabAuditBlock lines={timelineLines} compact tone={tone} />
      ) : null}
    </div>
  );
}
