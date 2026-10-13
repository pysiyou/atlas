/**
 * Sample collection queue card — desktop/mobile shells, left header column, data hooks.
 */

import { useMemo, type FC, type ReactNode } from 'react';
import { actionButtonPreset, Card, EntityId, IconButton } from '@/components';
import { useModal, ModalType } from '@/lib/context/ModalContext';
import { useTestCatalog } from '@/features/catalog';
import { usePatientNameLookup } from '@/features/patients';
import { getTestNames } from '@/features/catalog/testLookup';
import { CONTAINER_COLOR_OPTIONS, CONTAINER_CONFIG, type ContainerType, type Sample, type RejectedSample } from '@/types';
import type { ContainerTopColor } from '@/types';
import type { SampleCollectionQueueItem, SampleRequirement } from '@/types/lab-operations';
import { cn, formatDate } from '@/utils';
import { CollectionHeaderBadges } from '../components/LabWorkflowBadges';
import { LabAuditBlock } from '../components/LabWorkflowHeader.parts';
import { LabCardMetaRow, QueueAgeMeta, RecollectionRequestedMeta } from '../components/LabCardMetaRow';
import { SampleCollectionPopover } from '../collection/SampleCollectionPopover';
import { SampleRejectionPopover } from '../collection/SampleRejectionPopover';
import { LAB_CONFIG } from '../constants';
import { buildSampleCollectionTimelineLines } from '../constants/labWorkflowAuditLines';
import { useLabWorkflowCardClickGuard } from '../hooks';
import { useLabWorkflowResponsiveCard } from '../hooks/useLabWorkflowResponsiveCard';
import { formatVolume, getCollectionRequirements, getEffectiveContainerType, printSampleCollectionLabel } from '../utils';
import {
  LAB_CARD_ALERT,
  LAB_CARD_CONTEXT,
  LAB_CARD_HEADER,
  LAB_CARD_QUEUE_IDENTITY,
  LAB_MOBILE_CARD,
} from '../utils/labStyles';
import { QueueCard, QueueCardMobile, QueueCardPanel, QueueCardTestList } from './queueCardLayout';

// ——— Public types ———

export interface SampleCollectionCardProps {
  display: SampleCollectionQueueItem;
  onCollect: (
    display: SampleCollectionQueueItem,
    volume: number,
    notes?: string,
    selectedColor?: string,
    containerType?: ContainerType
  ) => void;
  isCollecting?: boolean;
  isMobile?: boolean;
}

export interface SampleCollectionCardSharedData {
  display: SampleCollectionQueueItem;
  sample: Sample;
  requirement: SampleRequirement;
  onCollect: SampleCollectionCardProps['onCollect'];
  patientName: string;
  testNames: string[];
  handleCardClick: (e?: React.MouseEvent) => void;
  isCollecting: boolean;
}

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

// ——— View model ———

function getSampleCollectionViewModel(display: SampleCollectionQueueItem, sample: Sample) {
  const { order } = display;
  const isPending = sample.status === 'pending';
  const isCollected = sample.status === 'collected';
  const isRejected = sample.status === 'rejected';
  const isDone = isCollected || isRejected;
  const hasContainerInfo = isDone && 'actualContainerColor' in sample;
  const containerColor = hasContainerInfo ? sample.actualContainerColor : undefined;

  return {
    order,
    isPending,
    isCollected,
    isRejected,
    isRecollection: sample.isRecollection === true,
    collectAllowed: display.allowedActions?.collect ?? false,
    collectDisabledTitle: display.denyMessage ?? undefined,
    rejectedSample: isRejected ? (sample as RejectedSample) : null,
    containerColor,
    colorName: containerColor
      ? CONTAINER_COLOR_OPTIONS.find(opt => opt.value === containerColor)?.label || 'N/A'
      : 'N/A',
    effectiveContainerType: getEffectiveContainerType(
      hasContainerInfo && 'actualContainerType' in sample ? sample.actualContainerType : undefined,
      sample.sampleType
    ),
    collectedVolume: isDone && 'collectedVolume' in sample ? sample.collectedVolume : undefined,
    collectedAt: isDone && 'collectedAt' in sample ? sample.collectedAt : undefined,
    collectedBy: isDone && 'collectedBy' in sample ? sample.collectedBy : undefined,
  };
}

// ——— Left header column (shared with collection detail modal) ———

function InlineDot() {
  return (
    <span className={LAB_CARD_CONTEXT.separator}>{LAB_CARD_CONTEXT.inlineDot}</span>
  );
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
  line1.push(
    <EntityId key="sam" type="sample" value={sampleId} className={idClass} />
  );

  const line2: ReactNode[] = [];
  if (referringPhysician) {
    line2.push(
      <span
        key="phys"
        className={cn(LAB_CARD_QUEUE_IDENTITY.secondaryText, 'min-w-0 truncate')}
      >
        {referringPhysician}
      </span>
    );
  }
  if (orderId) {
    if (line2.length > 0) line2.push(<InlineDot key="dot-ord" />);
    line2.push(
      <EntityId
        key="ord"
        type="order"
        value={orderId}
        variant="secondary"
        className={idClass}
      />
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

function SampleCollectionOperationsRow({
  sample,
  isPending,
  isCollected,
  isRejected,
  rejectedSample,
  orderDate,
  requiredVolume,
  collectedVolume,
  effectiveContainerType,
  containerColor,
  colorName,
}: Pick<
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
>) {
  const required = requiredVolume ?? sample.requiredVolume;
  const derived = getCollectionRequirements(sample.sampleType);
  const hasContainer =
    (isCollected || isRejected) && Boolean(effectiveContainerType && containerColor);
  const attempt = sample.recollectionAttempt ?? 1;
  const max = LAB_CONFIG.MAX_RECOLLECTION_ATTEMPTS;
  const showAttemptAlert = sample.isRecollection && attempt > 1;

  return (
    <LabCardMetaRow>
      {isPending && orderDate ? <QueueAgeMeta since={orderDate} /> : null}
      {isPending && required != null ? <span>{formatVolume(required)} required</span> : null}
      {(isCollected || isRejected) && collectedVolume != null ? (
        <span>
          {formatVolume(collectedVolume)} {isRejected ? 'was collected' : 'collected'}
        </span>
      ) : null}
      {(isCollected || isRejected) && required != null ? (
        <span>{formatVolume(required)} required</span>
      ) : null}
      {hasContainer && effectiveContainerType ? (
        <span>
          {CONTAINER_CONFIG[effectiveContainerType]?.label ?? effectiveContainerType}
          {colorName && colorName !== 'N/A' ? ` · ${colorName} cap` : null}
        </span>
      ) : null}
      {derived.isDerived ? <span>{derived.label}</span> : null}
      {isRejected && rejectedSample?.recollectionSampleId ? (
        <RecollectionRequestedMeta recollectionSampleId={rejectedSample.recollectionSampleId} />
      ) : null}
      {showAttemptAlert ? (
        <span className={attempt >= max - 1 ? 'text-warning-fg' : undefined}>
          Attempt {attempt}/{max}
        </span>
      ) : null}
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

function useSampleCollectionCardHeader(
  display: SampleCollectionQueueItem,
  sample: Sample,
  requirement: SampleRequirement,
  patientName: string
) {
  const vm = getSampleCollectionViewModel(display, sample);

  const leftColumn = useMemo(
    () => (
      <SampleCollectionCardLeftColumn
        patientName={patientName}
        orderId={vm.order.orderId}
        referringPhysician={vm.order.referringPhysician}
        orderDate={vm.order.orderDate}
        sample={sample}
        isPending={vm.isPending}
        isCollected={vm.isCollected}
        isRejected={vm.isRejected}
        rejectedSample={vm.rejectedSample}
        requiredVolume={requirement.totalVolume}
        collectedVolume={vm.collectedVolume}
        effectiveContainerType={vm.effectiveContainerType}
        containerColor={vm.containerColor}
        colorName={vm.colorName}
        collectedAt={vm.collectedAt}
        collectedBy={vm.collectedBy}
        tone="card"
      />
    ),
    [
      patientName,
      vm.order.orderId,
      vm.order.referringPhysician,
      vm.order.orderDate,
      sample,
      vm.isPending,
      vm.isCollected,
      vm.isRejected,
      vm.rejectedSample,
      requirement.totalVolume,
      vm.collectedVolume,
      vm.effectiveContainerType,
      vm.containerColor,
      vm.colorName,
      vm.collectedAt,
      vm.collectedBy,
    ]
  );

  const badges = (
    <CollectionHeaderBadges
      sample={sample}
      isPending={vm.isPending}
      isCollected={vm.isCollected}
      isRejected={vm.isRejected}
      statusPresentation={display.statusPresentation}
    />
  );

  return { vm, leftColumn, badges };
}

export function useSampleCollectionCardData(
  props: SampleCollectionCardProps
): SampleCollectionCardSharedData | null {
  const { display, onCollect, isCollecting = false } = props;
  const { getPatientName } = usePatientNameLookup();
  const { tests } = useTestCatalog();
  const { openModal } = useModal();

  const { sample, requirement } = display;

  const openSampleModal = useMemo(() => {
    return () => {
      const isPending = sample?.status === 'pending';
      const isCollected = sample?.status === 'collected';
      const isRejected = sample?.status === 'rejected';

      if ((isCollected || isRejected) && sample?.sampleId) {
        openModal(ModalType.SAMPLE_DETAIL, { sampleId: sample.sampleId.toString() });
      } else if (isPending) {
        openModal(ModalType.SAMPLE_DETAIL, { pendingSampleDisplay: display, onCollect });
      }
    };
  }, [sample, display, onCollect, openModal]);

  const handleCardClick = useLabWorkflowCardClickGuard(openSampleModal);

  if (!sample || !requirement) return null;

  const patientName = getPatientName(display.order.patientId);
  const testNames = requirement.testCodes ? getTestNames(requirement.testCodes, tests) : [];

  return {
    display,
    sample,
    requirement,
    onCollect,
    patientName,
    testNames,
    handleCardClick,
    isCollecting,
  };
}

// ——— Card shells ———

function SampleCollectionCardDesktop({
  display,
  sample,
  requirement,
  onCollect,
  patientName,
  testNames,
  handleCardClick,
}: SampleCollectionCardSharedData) {
  const { vm, leftColumn, badges } = useSampleCollectionCardHeader(
    display,
    sample,
    requirement,
    patientName
  );

  return (
    <QueueCard
      onClick={handleCardClick}
      className={vm.isRejected ? 'border-warning-stroke-emphasis' : ''}
      leftColumn={leftColumn}
      badges={badges}
      actionsPlacement="header"
      actions={
        <div className="flex items-center gap-space-2">
          {vm.isPending ? (
            <SampleCollectionPopover
              requirement={requirement}
              patientName={patientName}
              testName={testNames.join(', ')}
              isRecollection={vm.isRecollection}
              collectDisabled={!vm.collectAllowed}
              collectDisabledTitle={vm.collectDisabledTitle}
              onConfirm={(volume, notes, color, containerType) =>
                onCollect(display, volume, notes, color, containerType)
              }
            />
          ) : vm.isCollected && sample.sampleId ? (
            <>
              <SampleRejectionPopover
                sampleId={sample.sampleId.toString()}
                testCodes={sample.testCodes ?? []}
                sampleType={sample.sampleType}
                patientName={patientName}
                isRecollection={vm.isRecollection}
              />
              <IconButton
                onClick={() => printSampleCollectionLabel(display, patientName)}
                {...actionButtonPreset('print')}
                size="sm"
                title="Print Sample Label"
              />
            </>
          ) : null}
        </div>
      }
      content={
        <QueueCardTestList
          tests={testNames.map((name, i) => ({ name, code: requirement.testCodes[i] || '' }))}
        />
      }
      contentTitle="Required for"
    />
  );
}

function SampleCollectionCardMobile({
  display,
  sample,
  requirement,
  onCollect,
  patientName,
  testNames,
  handleCardClick,
  isCollecting,
}: SampleCollectionCardSharedData) {
  const { vm, leftColumn, badges } = useSampleCollectionCardHeader(
    display,
    sample,
    requirement,
    patientName
  );

  const actions = vm.isPending ? (
    <SampleCollectionPopover
      requirement={requirement}
      patientName={patientName}
      testName={testNames.join(', ')}
      isRecollection={vm.isRecollection}
      collectDisabled={!vm.collectAllowed}
      collectDisabledTitle={vm.collectDisabledTitle}
      onConfirm={(volume, notes, color, containerType) =>
        onCollect(display, volume, notes, color, containerType)
      }
      isSubmitting={isCollecting}
    />
  ) : (
    <IconButton
      {...actionButtonPreset('view')}
      size="sm"
      title="View Details"
      onClick={e => {
        e.stopPropagation();
        handleCardClick();
      }}
    />
  );

  return (
    <Card padding="sm" hover className={LAB_MOBILE_CARD.surface} onClick={() => handleCardClick()}>
      <QueueCardMobile
        leftColumn={leftColumn}
        badges={badges}
        actions={actions}
        actionsPlacement="header"
      >
        <QueueCardPanel title="Required for">
          <QueueCardTestList
            tests={testNames.map((name, i) => ({ name, code: requirement.testCodes[i] || '' }))}
          />
        </QueueCardPanel>
      </QueueCardMobile>
    </Card>
  );
}

export const SampleCollectionCard: FC<SampleCollectionCardProps> = props => {
  const sharedData = useSampleCollectionCardData(props);

  const card = useLabWorkflowResponsiveCard({
    item: props,
    deriveSharedData: () => sharedData as SampleCollectionCardSharedData,
    renderMobile: SampleCollectionCardMobile,
    renderDesktop: SampleCollectionCardDesktop,
    isMobile: props.isMobile,
  });

  if (!sharedData) return null;

  return card;
};
