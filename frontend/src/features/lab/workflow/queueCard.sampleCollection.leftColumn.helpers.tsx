/**
 * Sample collection queue card — shared left header column and view model.
 */

import { type ReactNode } from 'react';
import { RecordId } from '@/features/shared';
import { type ContainerType, type Sample, type RejectedSample } from '@/types';
import type { ContainerTopColor } from '@/types';
import type { SampleCollectionQueueItem, SampleRequirement } from '@/types/lab-operations';
import { cn, formatDate } from '@/utils';
import { LabAuditBlock } from '../components/LabWorkflowHeader.parts';
import { CollectionOperationalMetaRow } from '../components/CollectionOperationalMetaItems';
import { buildCollectionOperationalMetaItems } from '../utils/collectionOperationalMetaItems';
import { buildSampleCollectionTimelineLines } from '../constants/labWorkflowAuditLines';
import {
  WORKLIST_CARD_ALERT,
  IDENTITY_INLINE,
  CARD_HEADER_GRID,
  IDENTITY_STACK,
} from '@/theme/recipes';

export interface SampleCollectionCardLeftColumnProps {
  patientName: string;
  orderId: number;
  referringPhysician?: string;
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

function InlineDot() {
  return <span className={IDENTITY_INLINE.separator}>{IDENTITY_INLINE.inlineDot}</span>;
}

function SampleCollectionIdentityLines({
  patientName,
  sampleId,
  orderId,
  referringPhysician,
  orderDate,
}: {
  patientName: string;
  sampleId: number;
  orderId: number;
  referringPhysician?: string;
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
  if (referringPhysician) {
    line2.push(
      <span key="phys" className={cn(IDENTITY_STACK.secondaryText, 'min-w-0 truncate')}>
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
  referringPhysician,
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
        referringPhysician={referringPhysician}
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
