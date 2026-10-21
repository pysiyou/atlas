/**
 * Sample collection queue card — desktop/mobile shells, left header column, data hooks.
 */
/* eslint-disable react-refresh/only-export-components -- queue card + colocated data hook */

import { useMemo, type FC } from 'react';
import { actionButtonPreset, IconButton } from '@/components/primitives';
import { Card } from '@/components/surfaces';
import { useModal, ModalType } from '@/lib/context/ModalContext';
import { getTestNames } from '@/features/catalog/testLookup';
import type { ContainerType, TestSummary } from '@/types';
import type { SampleCollectionQueueItem } from '@/types/lab-operations';
import { MOBILE_LIST_CARD } from '@/theme/recipes';
import { CollectionHeaderBadges } from '../components/LabWorkflowBadges';
import { SampleCollectionPopover } from '../collection/SampleCollectionPopover';
import { SampleRejectionPopover } from '../collection/SampleRejectionPopover';
import { useLabWorkflowCardClickGuard } from '../hooks';
import { useLabWorkflowResponsiveCard } from '../hooks/useLabWorkflowResponsiveCard';
import { printSampleCollectionLabel } from '../utils';
import { QueueCard, QueueCardMobile, QueueCardPanel, QueueCardTestList } from './queueCardLayout';
import {
  SampleCollectionCardLeftColumn,
  type SampleCollectionCardLeftColumnProps,
  type SampleCollectionCardSharedData,
} from './queueCardLeftColumn';
import { getSampleCollectionViewModel } from './queueCard.sampleCollection.viewModel';

export type { SampleCollectionCardLeftColumnProps, SampleCollectionCardSharedData };

export { SampleCollectionCardLeftColumn };

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
  /** Catalog tests hoisted from the queue to avoid per-card fetches. */
  tests: TestSummary[];
}

function SampleCollectionCardLeftColumnFromVm({
  sample,
  requirement,
  patientName,
  vm,
}: {
  sample: SampleCollectionCardSharedData['sample'];
  requirement: SampleCollectionCardSharedData['requirement'];
  patientName: string;
  vm: ReturnType<typeof getSampleCollectionViewModel>;
}) {
  return (
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
  );
}

export function SampleCollectionCardDesktop({
  display,
  sample,
  requirement,
  onCollect,
  patientName,
  testNames,
  handleCardClick,
}: SampleCollectionCardSharedData) {
  const vm = getSampleCollectionViewModel(display, sample);

  const leftColumn = (
    <SampleCollectionCardLeftColumnFromVm
      sample={sample}
      requirement={requirement}
      patientName={patientName}
      vm={vm}
    />
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
              testNames={testNames}
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

export function SampleCollectionCardMobile({
  display,
  sample,
  requirement,
  onCollect,
  patientName,
  testNames,
  handleCardClick,
  isCollecting,
}: SampleCollectionCardSharedData) {
  const vm = getSampleCollectionViewModel(display, sample);

  const leftColumn = (
    <SampleCollectionCardLeftColumnFromVm
      sample={sample}
      requirement={requirement}
      patientName={patientName}
      vm={vm}
    />
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

  const actions = vm.isPending ? (
    <SampleCollectionPopover
      requirement={requirement}
      patientName={patientName}
      testNames={testNames}
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
    <Card padding="sm" hover className={MOBILE_LIST_CARD.surface} onClick={() => handleCardClick()}>
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

export function useSampleCollectionCardData(
  props: SampleCollectionCardProps
): SampleCollectionCardSharedData | null {
  const { display, onCollect, isCollecting = false } = props;
  const { tests } = props;
  const { openModal } = useModal();

  const { sample, requirement } = display;

  const openSampleModal = useMemo(() => {
    return () => {
      if (sample?.sampleId == null) return;
      openModal({
        type: ModalType.SAMPLE_DETAIL,
        sampleId: sample.sampleId.toString(),
      });
    };
  }, [sample, openModal]);

  const handleCardClick = useLabWorkflowCardClickGuard(openSampleModal);

  if (!sample || !requirement) return null;

  const patientName = display.patient?.fullName || display.order.patientName || '—';
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

function passThroughSharedData(
  data: SampleCollectionCardSharedData | null
): SampleCollectionCardSharedData {
  return data as SampleCollectionCardSharedData;
}

export const SampleCollectionCard: FC<SampleCollectionCardProps> = props => {
  const sharedData = useSampleCollectionCardData(props);

  const card = useLabWorkflowResponsiveCard({
    item: sharedData,
    deriveSharedData: passThroughSharedData,
    renderMobile: SampleCollectionCardMobile,
    renderDesktop: SampleCollectionCardDesktop,
    isMobile: props.isMobile,
  });

  if (!sharedData) return null;

  return card;
};
