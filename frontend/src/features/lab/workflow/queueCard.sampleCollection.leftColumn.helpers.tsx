/**
 * Sample collection queue card — shared left header column and view model.
 */

import { type ReactNode } from 'react';
import { EntityId } from '@/components/display';
import { type ContainerType, type Sample, type RejectedSample } from '@/types';
import type { ContainerTopColor } from '@/types';
import type { SampleCollectionQueueItem, SampleRequirement } from '@/types/lab-operations';
import { cn, formatDate } from '@/utils';
import { LabAuditBlock } from '../components/LabWorkflowHeader.parts';
import { LabCardMetaRow } from '../components/LabCardMetaRow';
import { CollectionOperationalMetaItems } from '../components/CollectionOperationalMetaItems';
import { buildCollectionOperationalMetaItems } from '../utils/collectionOperationalMetaItems';
import { buildSampleCollectionTimelineLines } from '../constants/labWorkflowAuditLines';
import {
  LAB_CARD_ALERT,
  LAB_CARD_CONTEXT,
  LAB_CARD_HEADER,
  LAB_CARD_QUEUE_IDENTITY,
} from '../utils/labStyles';

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
  return <span className={LAB_CARD_CONTEXT.separator}>{LAB_CARD_CONTEXT.inlineDot}</span>;
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
      <span key="patient" className={cn(LAB_CARD_CONTEXT.patientName, 'min-w-0 truncate')}>
        {patientName}
      </span>
    );
  }
  line1.push(<InlineDot key="dot-sam" />);
  line1.push(<EntityId key="sam" type="sample" value={sampleId} className={idClass} />);

  const line2: ReactNode[] = [];
  if (referringPhysician) {
    line2.push(
      <span key="phys" className={cn(LAB_CARD_QUEUE_IDENTITY.secondaryText, 'min-w-0 truncate')}>
        {referringPhysician}
      </span>
    );
  }
  if (orderId) {
    if (line2.length > 0) line2.push(<InlineDot key="dot-ord" />);
    line2.push(
      <EntityId key="ord" type="order" value={orderId} variant="headerSecondary" className={idClass} />
    );
  }
  if (orderDate) {
    if (line2.length > 0) line2.push(<InlineDot key="dot-date" />);
    line2.push(
      <span key="date" className={LAB_CARD_QUEUE_IDENTITY.secondaryDate}>
        {formatDate(orderDate)}
      </span>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-space-0-5">
      <div className={cn(LAB_CARD_QUEUE_IDENTITY.primaryLine, 'min-w-0')}>{line1}</div>
      {line2.length > 0 ? (
        <div className={cn(LAB_CARD_QUEUE_IDENTITY.secondaryLine, 'min-w-0')}>{line2}</div>
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

  return (
    <LabCardMetaRow>
      <CollectionOperationalMetaItems items={items} />
    </LabCardMetaRow>
  );
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
    <div className={cn(LAB_CARD_HEADER.leftColumn, className)}>
      <SampleCollectionIdentityLines
        patientName={patientName}
        sampleId={sample.sampleId}
        orderId={orderId}
        referringPhysician={referringPhysician}
        orderDate={orderDate}
      />
      <div className={LAB_CARD_ALERT.row}>
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
