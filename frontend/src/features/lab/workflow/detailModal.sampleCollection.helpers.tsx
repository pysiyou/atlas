/**
 * Sample collection detail modal — content panels, detail grid, and footer.
 */

import Barcode from 'react-barcode';
import { actionButtonPreset, Button, Icon } from '@/components/primitives';
import { Panel } from '@/components/surfaces';
import type { ContainerType, Order, RejectedSample, Sample, Test } from '@/types';
import { text, RADIUS, SURFACE , FG } from '@/theme/recipes';
import { ModalFooter } from './detailModalLayout';
import { displayId, formatDateTime } from '@/utils';
import { CollectionDetailGrid } from './detailModal.sampleCollection.grid';
import { SampleCollectionRequirementsSection } from '../collection/SampleCollectionRequirementsSection';
import { formatRejectionReasons } from '../utils/labFormatters';
import { QueueCardTestList } from './queueCardLayout';
import { SampleCollectionPopover } from '../collection/SampleCollectionPopover';
import { SampleRejectionPopover } from '../collection/SampleRejectionPopover';
import { getSampleStatusIcon } from '@/config/icons';
import { LAB_COPY } from '../constants/labConstants';
import type { SampleCollectionQueueItem } from '@/types/lab-operations';
import { isLabActionAllowed } from '../utils/queueDisplay';

export function SampleCollectionDetailContent({
  sample,
  isPending,
  isRejected,
  isCollected,
  rejectedSample,
  testNames,
  testDetails,
  testCodes,
  getUserName,
  collectionNotes,
  collectedAt,
  collectedBy,
  collectedVolume,
  remainingVolume,
  effectiveContainerType,
  containerColor,
  colorName,
  requirement,
  showBarcode = false,
}: {
  sample: Sample;
  isPending: boolean;
  isRejected: boolean;
  isCollected: boolean;
  rejectedSample: RejectedSample | null;
  testNames: string[];
  testDetails: Test[];
  testCodes: string[];
  getUserName: (userId: string) => string;
  collectionNotes?: string;
  collectedAt?: string;
  collectedBy?: string;
  collectedVolume?: number;
  remainingVolume?: number;
  effectiveContainerType: ContainerType;
  containerColor?: string;
  colorName: string;
  requirement?: {
    containerTypes: ContainerType[];
    containerTopColors: string[];
  };
  showBarcode?: boolean;
}) {
  return (
    <>
      {showBarcode && sample.sampleId != null && (
        <div className={`flex items-center justify-center ${SURFACE.recessed} ${RADIUS.field} p-panel`}>
          <Barcode
            value={displayId.sample(sample.sampleId)}
            height={40}
            displayValue={false}
            background="transparent"
            lineColor="var(--text)"
            margin={0}
          />
        </div>
      )}
      <Panel preset="panel.compact.standard" title="Required for">
        <QueueCardTestList
          tests={testNames.map((name, i) => ({ name, code: testCodes[i] || '' }))}
        />
      </Panel>

      {isRejected && rejectedSample && (
        <Panel preset="panel.compact.standard" title="Rejection Details">
          <div className={`space-y-space-2 ${text({ role: 'label' })}`}>
            {rejectedSample.rejectionReasons && rejectedSample.rejectionReasons.length > 0 && (
              <p>
                <span className={FG.captionMuted}>Reason: </span>
                {formatRejectionReasons(rejectedSample.rejectionReasons)}
              </p>
            )}
            {rejectedSample.rejectionNotes && (
              <p>
                <span className={FG.captionMuted}>Notes: </span>
                {rejectedSample.rejectionNotes}
              </p>
            )}
            <p>
              <span className={FG.captionMuted}>Rejected by </span>
              {getUserName(rejectedSample.rejectedBy)}
              <span className={FG.captionMuted}> on </span>
              {formatDateTime(rejectedSample.rejectedAt)}
            </p>
            {rejectedSample.recollectionRequired && (
              <p className="text-warning-fg">Recollection required</p>
            )}
          </div>
        </Panel>
      )}

      {isPending && testDetails.length > 0 && (
        <SampleCollectionRequirementsSection testDetails={testDetails} />
      )}

      {collectionNotes && (
        <Panel preset="panel.compact.standard" title="Collection Notes">
          <div className={text({ role: 'amount' })}>{collectionNotes}</div>
        </Panel>
      )}

      <CollectionDetailGrid
        sample={sample}
        isPending={isPending}
        isRejected={isRejected}
        isCollected={isCollected}
        collectedAt={collectedAt}
        collectedBy={collectedBy}
        collectedVolume={collectedVolume}
        remainingVolume={remainingVolume}
        effectiveContainerType={effectiveContainerType}
        containerColor={containerColor}
        colorName={colorName}
        requirement={requirement}
        getUserName={getUserName}
      />
    </>
  );
}

export function SampleCollectionDetailFooter({
  sample,
  isPending,
  isRejected,
  isCollected,
  pendingSampleDisplay,
  patientName,
  testNames,
  onCollect,
  onClose,
  onPopoverSubmittingChange,
}: {
  sample: Sample;
  order: Order | undefined;
  isPending: boolean;
  isRejected: boolean;
  isCollected: boolean;
  rejectedSample: RejectedSample | null;
  pendingSampleDisplay: SampleCollectionQueueItem | undefined;
  patientName: string;
  testNames: string[];
  onCollect?: (
    display: SampleCollectionQueueItem,
    volume: number,
    notes?: string,
    selectedColor?: string,
    containerType?: ContainerType
  ) => void;
  onClose: () => void;
  onPopoverSubmittingChange?: (submitting: boolean) => void;
}) {
  if (isPending && pendingSampleDisplay && onCollect) {
    const isRecollection = sample.isRecollection === true;
    const collectAllowed = isLabActionAllowed(pendingSampleDisplay.allowedActions, 'collect');
    return (
      <ModalFooter statusIcon={undefined} statusMessage="" statusClassName={FG.modalStatus}>
        <SampleCollectionPopover
          requirement={pendingSampleDisplay.requirement!}
          patientName={patientName}
          testNames={testNames}
          isRecollection={isRecollection}
          collectDisabled={!collectAllowed}
          collectDisabledTitle={pendingSampleDisplay.denyMessage ?? undefined}
          onConfirm={async (volume, notes, color, ct) => {
            await Promise.resolve(onCollect(pendingSampleDisplay, volume, notes, color, ct));
            onClose();
          }}
          onSubmittingChange={onPopoverSubmittingChange}
          trigger={
            <Button {...actionButtonPreset('collect')} size="md" disabled={!collectAllowed}>
              {isRecollection ? 'Recollect Sample' : 'Collect Sample'}
            </Button>
          }
        />
      </ModalFooter>
    );
  }

  if (isCollected && sample.sampleId) {
    return (
      <ModalFooter
        statusIcon={
          <Icon name={getSampleStatusIcon('collected')} className={`w-3.5 h-3.5 ${FG.disabled}`} />
        }
        statusMessage=""
        statusClassName={FG.modalStatus}
      >
        <SampleRejectionPopover
          sampleId={sample.sampleId.toString()}
          testCodes={sample.testCodes ?? []}
          sampleType={sample.sampleType}
          patientName={patientName}
          isRecollection={sample.isRecollection || false}
          onSuccess={onClose}
          trigger={
            <Button {...actionButtonPreset('reject')} size="md">
              {LAB_COPY.quality.reportSampleIssue}
            </Button>
          }
        />
      </ModalFooter>
    );
  }

  if (isRejected) {
    return (
      <ModalFooter
        statusIcon={
          <Icon name={getSampleStatusIcon('rejected')} className={`w-3.5 h-3.5 ${FG.disabled}`} />
        }
        statusMessage=""
        statusClassName={FG.modalStatus}
      />
    );
  }

  return null;
}
