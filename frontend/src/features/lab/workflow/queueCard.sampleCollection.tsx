import type { FC } from 'react';
import { actionButtonPreset, Card, IconButton } from '@/components';
import { CollectionHeaderBadges } from '../components/LabWorkflowBadges';
import { QueueCard, QueueCardTestList } from './queueCardLayout';
import { QueueCardMobile } from './queueCardLayout';
import { QueueCardPanel } from './queueCardLayout';
import { LAB_MOBILE_CARD } from '../utils/labStyles';
import { SampleCollectionPopover } from '../collection/SampleCollectionPopover';
import { SampleRejectionPopover } from '../collection/SampleRejectionPopover';
import { printSampleCollectionLabel } from '../utils';
import { useLabWorkflowResponsiveCard } from '../hooks/useLabWorkflowResponsiveCard';
import {
  useSampleCollectionCardData,
  type SampleCollectionCardProps,
  type SampleCollectionCardSharedData,
} from './queueCard.sampleCollection.data';
import { useSampleCollectionCardHeader } from './queueCard.sampleCollection.header';

export type { SampleCollectionCardProps } from './queueCard.sampleCollection.data';

function SampleCollectionCardDesktop({
  display,
  sample,
  requirement,
  onCollect,
  patientName,
  testNames,
  handleCardClick,
}: SampleCollectionCardSharedData) {
  const { vm, auditLines, alerts, badges } = useSampleCollectionCardHeader(
    display,
    sample,
    requirement
  );

  return (
    <QueueCard
      onClick={handleCardClick}
      className={vm.isRejected ? 'border-warning-stroke-emphasis' : ''}
      context={{
        patientName,
        patientId: display.order.patientId,
        orderId: vm.order.orderId,
        sampleId: sample.sampleId,
        referringPhysician: vm.order.referringPhysician,
      }}
      auditLines={auditLines}
      alerts={alerts}
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
  const { vm, auditLines, alerts } = useSampleCollectionCardHeader(display, sample, requirement);

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
        context={{
          patientName,
          patientId: display.order.patientId,
          orderId: vm.order.orderId,
          sampleId: sample.sampleId,
        }}
        auditLines={auditLines}
        alerts={alerts}
        badges={
          <CollectionHeaderBadges
            sample={sample}
            isPending={vm.isPending}
            isCollected={vm.isCollected}
            isRejected={vm.isRejected}
            statusPresentation={display.statusPresentation}
            size="xs"
          />
        }
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
