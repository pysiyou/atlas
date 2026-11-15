/**
 * Left column for sample-collection queue cards and the collection detail modal.
 */

import { type ReactNode } from 'react';
import { cn, formatDate } from '@/utils';
import { RecordId } from '@/features/shared';
import { type ContainerType, type Sample, type RejectedSample } from '@/types';
import type { ContainerTopColor } from '@/types';
import { LabWorkflowLeftColumn } from '../../components/LabWorkflowLeftColumn';
import { CollectionOperationalMetaRow } from '../../components/CollectionOperationalMetaItems';
import { buildCollectionOperationalMetaItems } from '../../utils/collectionOperationalMetaItems';
import { buildSampleCollectionTimelineLines } from '../../constants/labWorkflowAuditLines';
import { IDENTITY_INLINE, IDENTITY_STACK } from '@/theme/recipes';

function InlineDot() {
  return (
    <span className={IDENTITY_INLINE.separator}>{IDENTITY_INLINE.inlineDot}</span>
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

/**
 * Two-line identity: patient + sample on the first line; doctor, order, date on the second.
 */
function SampleCollectionIdentityLines({
  patientName,
  sampleId,
  accessionNumber,
  orderId,
  referentDoctorName,
  orderDate,
}: {
  patientName: string;
  sampleId: number;
  accessionNumber?: string | null;
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
  if (accessionNumber) {
    line1.push(<InlineDot key="dot-acc" />);
    line1.push(
      <span key="acc" className={cn(IDENTITY_STACK.secondaryText, idClass)}>
        {accessionNumber}
      </span>
    );
  }

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

/**
 * Container / volume / rejection chips for the collection ops row.
 */
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

/**
 * Collection left column: two-line identity, ops row, collection audit.
 */
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
    <LabWorkflowLeftColumn
      className={className}
      tone={tone}
      identity={
        <SampleCollectionIdentityLines
          patientName={patientName}
          sampleId={sample.sampleId}
          accessionNumber={sample.accessionNumber}
          orderId={orderId}
          referentDoctorName={referentDoctorName}
          orderDate={orderDate}
        />
      }
      alerts={
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
      }
      auditLines={timelineLines}
    />
  );
}
