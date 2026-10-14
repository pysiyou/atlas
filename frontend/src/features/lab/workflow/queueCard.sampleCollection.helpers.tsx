/**
 * Sample collection queue card — desktop and mobile card shells.
 */

import { actionButtonPreset, IconButton } from '@/components/primitives';
import { Card } from '@/components/surfaces';
import { CollectionHeaderBadges } from '../components/LabWorkflowBadges';
import { SampleCollectionPopover } from '../collection/SampleCollectionPopover';
import { SampleRejectionPopover } from '../collection/SampleRejectionPopover';
import { printSampleCollectionLabel } from '../utils';
import { LAB_MOBILE_CARD } from '../utils/labStyles';
import { QueueCard, QueueCardMobile, QueueCardPanel, QueueCardTestList } from './queueCardLayout';
import {
  SampleCollectionCardLeftColumn,
  type SampleCollectionCardSharedData,
} from './queueCard.sampleCollection.leftColumn.helpers';
import { getSampleCollectionViewModel } from './queueCard.sampleCollection.viewModel';

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
