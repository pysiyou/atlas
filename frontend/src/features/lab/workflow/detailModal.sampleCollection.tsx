/**
 * SampleCollectionDetailModal - Extended view for sample details
 *
 * Provides a full view of sample information including collection requirements,
 * rejection details, and linked tests.
 *
 * Uses centralized components:
 * - DetailGrid with sections config for consistent layout
 * - Panel for custom sections
 * - LabModalHeader sampleInfo for collection metadata (same as entry/validation modals)
 */

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query';
import { sampleAPI } from '../api/samples';
import Barcode from 'react-barcode';
import { actionButtonPreset, Button, EntityId, Icon, Panel } from '@/components';
import type { ContainerType, Order, RejectedSample, Sample, Test } from '@/types';
import { CONTAINER_COLOR_OPTIONS, CONTAINER_CONFIG } from '@/types';
import { formatVolume } from '../utils';
import { RADIUS, SURFACE, TONE, TYPE } from '@/components/theme/recipes';
import { DetailGrid } from './detailModalLayout';
import { displayId, formatDateTime } from '@/utils';
import { formatStatusBadgeLabel } from '@/utils/statusBadge';
import { SampleCollectionRequirementsSection } from '../collection/SampleCollectionRequirementsSection';
import { formatRejectionReasons } from '../utils/labFormatters';
import { QueueCardTestList } from './queueCardLayout';
import { SampleCollectionPopover } from '../collection/SampleCollectionPopover';
import { SampleRejectionPopover } from '../collection/SampleRejectionPopover';
import { getSampleStatusIcon } from '@/config/icons';
import { LAB_COPY } from '../constants/labConstants';
import { LabEventLogPanel } from '@/features/audit';
import { QueueModalShell, ModalFooter, type DetailGridSectionConfig } from './detailModalLayout';
import { labModalSubtitle } from './detailModalLayout';
import { collectionHeaderAudit } from '../constants/labWorkflowAuditLines';
import { CollectionCardAlerts, CollectionHeaderBadges } from '../components/LabWorkflowBadges';
import { useTestCatalog } from '@/features/catalog';
import { useUserLookup } from '@/lib/api/users';
import { usePatientNameLookup } from '@/features/patients';
import { useOrderLookup } from '@/features/orders';
import { useSampleLookup } from '../api/samples';
import { LabRelatedSamplesPanel } from '../components/LabRelatedWorkflowPanel';
import { ModalType, useModal } from '@/lib/context/ModalContext';
import { getTestNames } from '@/features/catalog/testLookup';
import type { SampleCollectionQueueItem } from '@/types/lab-operations';

interface CollectionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  sampleId?: string;
  pendingSampleDisplay?: SampleCollectionQueueItem;
  onCollect?: (
    display: SampleCollectionQueueItem,
    volume: number,
    notes?: string,
    selectedColor?: string,
    containerType?: ContainerType
  ) => void;
  readOnly?: boolean;
}

// Large component is necessary for comprehensive collection detail modal with multiple sections, status management, and conditional rendering
// eslint-disable-next-line max-lines-per-function
export const SampleCollectionDetailModal: React.FC<CollectionDetailModalProps> = ({
  isOpen,
  onClose,
  sampleId,
  pendingSampleDisplay,
  onCollect,
  readOnly = false,
  // High complexity is necessary for comprehensive modal content with multiple conditional sections and state management
  // eslint-disable-next-line complexity
}) => {
  const { getUserName } = useUserLookup();
  const { getSample } = useSampleLookup();
  const { getPatientName } = usePatientNameLookup();
  const { getOrder } = useOrderLookup();
  const { tests = [] } = useTestCatalog();
  const { openModal } = useModal();
  const [isPopoverSubmitting, setIsPopoverSubmitting] = useState(false);

  const cachedSample = sampleId ? getSample(sampleId) : undefined;
  const { data: fetchedSample } = useQuery({
    queryKey: queryKeys.samples.byId(sampleId ?? ''),
    queryFn: () => sampleAPI.getById(sampleId!),
    enabled: isOpen && !!sampleId && !cachedSample,
  });
  const sample = cachedSample ?? fetchedSample ?? pendingSampleDisplay?.sample;
  const order = pendingSampleDisplay?.order || (sample ? getOrder(sample.orderId) : undefined);
  const requirement = pendingSampleDisplay?.requirement;

  const testDetails = useMemo(() => {
    if (!sample?.testCodes) return [];
    const seen = new Set<string>();
    return sample.testCodes
      .map(code => tests.find(t => t.code === code))
      .filter((test): test is NonNullable<typeof test> => test !== undefined)
      .filter(test => {
        if (seen.has(test.code)) return false;
        seen.add(test.code);
        return true;
      });
  }, [sample, tests]);

  if (!sample) return null;

  const isPending = sample.status === 'pending';
  const isRejected = sample.status === 'rejected';
  const isCollected = sample.status === 'collected';
  const rejectedSample = isRejected ? (sample as RejectedSample) : null;

  const patientId = order?.patientId || 0;
  const patientName =
    pendingSampleDisplay?.patient?.fullName ||
    (order ? getPatientName(order.patientId) : 'Unknown');
  const orderId = sample.orderId;
  const testNames = sample.testCodes ? getTestNames(sample.testCodes, tests) : [];

  const hasContainerInfo = (isCollected || isRejected) && 'actualContainerColor' in sample;
  const containerColor = hasContainerInfo ? sample.actualContainerColor : undefined;
  const colorName = containerColor
    ? CONTAINER_COLOR_OPTIONS.find(opt => opt.value === containerColor)?.label || 'N/A'
    : 'N/A';
  const containerType =
    hasContainerInfo && 'actualContainerType' in sample
      ? sample.actualContainerType
      : sample.requiredContainerTypes?.[0]; // Fallback to first required for pending or defaults
  const effectiveContainerType: ContainerType =
    (containerType as ContainerType) ||
    (sample.sampleType === 'urine' || sample.sampleType === 'stool' ? 'cup' : 'tube');

  const collectedAt =
    (isCollected || isRejected) && 'collectedAt' in sample ? sample.collectedAt : undefined;
  const collectedBy =
    (isCollected || isRejected) && 'collectedBy' in sample ? sample.collectedBy : undefined;
  const collectedVolume =
    (isCollected || isRejected) && 'collectedVolume' in sample ? sample.collectedVolume : undefined;
  const remainingVolume =
    (isCollected || isRejected) && 'remainingVolume' in sample ? sample.remainingVolume : undefined;
  const collectionNotes =
    (isCollected || isRejected) && 'collectionNotes' in sample ? sample.collectionNotes : undefined;

  // Build header badges

  const headerBadges = (
    <CollectionHeaderBadges
      sample={sample}
      isPending={isPending}
      isCollected={isCollected}
      isRejected={isRejected}
      statusPresentation={pendingSampleDisplay?.statusPresentation}
    />
  );

  const headerMeta = (
    <CollectionCardAlerts
      sample={sample}
      isPending={isPending}
      isCollected={isCollected}
      isRejected={isRejected}
      rejectedSample={rejectedSample}
      orderDate={order?.orderDate}
      requiredVolume={sample.requiredVolume}
      collectedVolume={collectedVolume}
      containerColor={containerColor}
      effectiveContainerType={effectiveContainerType}
      colorName={colorName}
    />
  );

  // Build footer content
  const footerContent = (
    <SampleCollectionDetailFooter
      sample={sample}
      order={order}
      isPending={isPending}
      isRejected={isRejected}
      isCollected={isCollected}
      rejectedSample={rejectedSample}
      pendingSampleDisplay={pendingSampleDisplay}
      patientName={patientName}
      testNames={testNames}
      onCollect={onCollect}
      onClose={onClose}
      onPopoverSubmittingChange={setIsPopoverSubmitting}
    />
  );

  const gridSections = buildCollectionDetailGridSections({
    sample,
    isPending,
    isRejected,
    isCollected,
    collectedAt,
    collectedBy,
    collectedVolume,
    remainingVolume,
    effectiveContainerType,
    containerColor,
    colorName,
    requirement,
    getUserName,
  });

  return (
    <QueueModalShell
      isOpen={isOpen}
      onClose={onClose}
      disableClose={isPopoverSubmitting}
      title={<EntityId type="sample" value={sample.sampleId} />}
      subtitle={labModalSubtitle('collection')}
      headerBadges={headerBadges}
      headerMeta={headerMeta}
      contextInfo={{
        patientName,
        patientId,
        orderId,
        referringPhysician: order?.referringPhysician,
        sampleId: sample.sampleId,
      }}
      headerAudit={collectionHeaderAudit({
        sampleId: sample.sampleId,
        collectedAt,
        collectedBy,
        isRecollection: sample.isRecollection,
        originalSampleId: sample.originalSampleId,
        originalSampleCollectedAt: sample.originalSampleCollectedAt,
      })}
      footer={
        readOnly ? (
          <ModalFooter statusMessage="">
            <Button onClick={onClose} {...actionButtonPreset('cancel')} size="md" layout="icon-text">Close</Button>
          </ModalFooter>
        ) : (
          footerContent
        )
      }
    >
      <SampleCollectionDetailContent
        sample={sample}
        isPending={isPending}
        isRejected={isRejected}
        rejectedSample={rejectedSample}
        testNames={testNames}
        testDetails={testDetails}
        testCodes={sample.testCodes || []}
        getUserName={getUserName}
        collectionNotes={collectionNotes}
        gridSections={gridSections}
        showBarcode={(isCollected || isRejected) && sample.sampleId != null}
      />
      <LabRelatedSamplesPanel
        sample={sample}
        isOpen={isOpen}
        onOpenSample={sampleId =>
          openModal(ModalType.SAMPLE_DETAIL, { sampleId: String(sampleId), readOnly })
        }
      />
      {sample.sampleId != null && (
        <LabEventLogPanel sampleId={Number(sample.sampleId)} />
      )}
    </QueueModalShell>
  );
};

// --- file-local helpers ---

interface CollectionDetailGridSectionsProps {
  sample: Sample;
  isPending: boolean;
  isRejected: boolean;
  isCollected: boolean;
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
  getUserName: (userId: string) => string;
}

function buildCollectionDetailGridSections({
  sample,
  isPending,
  isRejected,
  isCollected,
  collectedAt,
  collectedBy,
  collectedVolume,
  remainingVolume,
  effectiveContainerType,
  containerColor,
  colorName,
  requirement,
  getUserName,
}: CollectionDetailGridSectionsProps): DetailGridSectionConfig[] {
  const sections: DetailGridSectionConfig[] = [];

  // Collection Details - collected/rejected only
  if ((isCollected || isRejected) && collectedAt) {
    sections.push({
      title: 'Collection Details',
      fields: [
        { label: 'Collected', timestamp: collectedAt },
        { label: 'Collected By', value: collectedBy ? getUserName(collectedBy) : undefined },
        {
          label: 'Container',
          value: (() => {
            const containerLabel =
              CONTAINER_CONFIG[effectiveContainerType]?.label ?? effectiveContainerType;
            return containerColor
              ? `${containerLabel} · ${colorName} top`
              : containerLabel;
          })(),
        },
      ],
    });
  }

  // Volume Tracking - always shown
  sections.push({
    title: 'Volume Tracking',
    fields: [
      { label: 'Required', value: formatVolume(sample.requiredVolume) },
      {
        label: 'Collected',
        value: collectedVolume !== undefined ? formatVolume(collectedVolume) : undefined,
      },
      {
        label: 'Remaining',
        value:
          remainingVolume !== undefined ? (
            <span className={remainingVolume < sample.requiredVolume * 0.2 ? TONE.danger.fg : ''}>
              {formatVolume(remainingVolume)}
            </span>
          ) : undefined,
      },
    ],
  });

  // Collection Requirements - pending only
  if (isPending && requirement) {
    sections.push({
      title: 'Collection Requirements',
      fields: [
        {
          label: 'Priority',
          value: sample.priority ? formatStatusBadgeLabel(sample.priority) : undefined,
        },
        {
          label: 'Required Container Types',
          value:
            requirement.containerTypes.length > 0
              ? requirement.containerTypes
                  .map(type => CONTAINER_CONFIG[type]?.label || type)
                  .join(', ')
              : undefined,
        },
        {
          label: 'Required Container Colors',
          value:
            requirement.containerTopColors.length > 0
              ? requirement.containerTopColors
                  .map(
                    color =>
                      `${CONTAINER_COLOR_OPTIONS.find(opt => opt.value === color)?.label || color} top`
                  )
                  .join(', ')
              : undefined,
        },
      ],
    });
  }

  return sections;
};

/**
 * SampleCollectionDetailContent Component
 * Renders the main content sections of the collection detail modal
 */

interface CollectionDetailContentProps {
  sample: Sample;
  isPending: boolean;
  isRejected: boolean;
  rejectedSample: RejectedSample | null;
  testNames: string[];
  testDetails: Test[];
  testCodes: string[];
  getUserName: (userId: string) => string;
  collectionNotes?: string;
  gridSections: DetailGridSectionConfig[];
  showBarcode?: boolean;
}



function SampleCollectionDetailContent({
  sample,
  isPending,
  isRejected,
  rejectedSample,
  testNames,
  testDetails,
  testCodes,
  getUserName,
  collectionNotes,
  gridSections,
  showBarcode = false,
}: CollectionDetailContentProps) {
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
      <Panel variant="lab" title="Required for">
        <QueueCardTestList
          tests={testNames.map((name, i) => ({ name, code: testCodes[i] || '' }))}
        />
      </Panel>

      {isRejected && rejectedSample && (
        <Panel variant="lab" title="Rejection Details">
          <div className={`space-y-space-2 ${TYPE.label}`}>
            {rejectedSample.rejectionReasons && rejectedSample.rejectionReasons.length > 0 && (
              <p>
                <span className="text-text-tertiary">Reason: </span>
                {formatRejectionReasons(rejectedSample.rejectionReasons)}
              </p>
            )}
            {rejectedSample.rejectionNotes && (
              <p>
                <span className="text-text-tertiary">Notes: </span>
                {rejectedSample.rejectionNotes}
              </p>
            )}
            <p>
              <span className="text-text-tertiary">Rejected by </span>
              {getUserName(rejectedSample.rejectedBy)}
              <span className="text-text-tertiary"> on </span>
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
        <Panel variant="lab" title="Collection Notes">
          <div className={TYPE.amount}>{collectionNotes}</div>
        </Panel>
      )}

      <DetailGrid sections={gridSections} />
    </>
  );
}

interface CollectionDetailFooterProps {
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
}

function SampleCollectionDetailFooter({
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
}: CollectionDetailFooterProps) {
  if (isPending && pendingSampleDisplay && onCollect) {
    const isRecollection = sample.isRecollection === true;
    const collectAllowed = pendingSampleDisplay.allowedActions?.collect ?? true;
    return (
      <ModalFooter statusIcon={undefined} statusMessage="" statusClassName="text-text-tertiary">
        <SampleCollectionPopover
          requirement={pendingSampleDisplay.requirement!}
          patientName={patientName}
          testName={testNames.join(', ')}
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
          <Icon name={getSampleStatusIcon('collected')} className="w-3.5 h-3.5 text-text-disabled" />
        }
        statusMessage=""
        statusClassName="text-text-tertiary"
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
          <Icon name={getSampleStatusIcon('rejected')} className="w-3.5 h-3.5 text-text-disabled" />
        }
        statusMessage=""
        statusClassName="text-text-tertiary"
      />
    );
  }

  return null;
}
