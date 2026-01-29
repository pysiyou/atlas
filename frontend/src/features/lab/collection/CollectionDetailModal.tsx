/**
 * CollectionDetailModal - Extended view for sample details
 *
 * Provides a full view of sample information including collection requirements,
 * rejection details, and linked tests.
 *
 * Uses centralized components:
 * - DetailGrid with sections config for consistent layout
 * - SectionContainer for custom sections
 * - CollectionInfoLine for sample metadata
 */

import React, { useMemo } from 'react';
import type { ContainerType, RejectedSample, RejectionReason } from '@/types';
import { CONTAINER_COLOR_OPTIONS } from '@/types';
import Barcode from 'react-barcode';
import toast from 'react-hot-toast';
import { logger } from '@/utils/logger';
import { displayId } from '@/utils';
import { CollectionInfoLine } from '../components/StatusBadges';
import { CollectionDetailHeaderBadges } from './CollectionDetailHeaderBadges';
import { CollectionDetailFooter } from './CollectionDetailFooter';
import { buildCollectionDetailGridSections } from './CollectionDetailGridSections';
import { CollectionDetailContent } from './CollectionDetailContent';
import {
  useSampleLookup,
  useTestNameLookup,
  useTestCatalog,
  usePatientNameLookup,
  useOrderLookup,
  useUserLookup,
  useRejectSample,
} from '@/hooks/queries';
import { getTestNames } from '@/utils/typeHelpers';
import { LabDetailModal } from '../components/LabDetailModal';
import type { SampleDisplay } from '../types';

interface CollectionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  sampleId?: string;
  pendingSampleDisplay?: SampleDisplay;
  onCollect?: (
    display: SampleDisplay,
    volume: number,
    notes?: string,
    selectedColor?: string,
    containerType?: ContainerType
  ) => void;
}

// Large component is necessary for comprehensive collection detail modal with multiple sections, status management, and conditional rendering
// eslint-disable-next-line max-lines-per-function
export const CollectionDetailModal: React.FC<CollectionDetailModalProps> = ({
  isOpen,
  onClose,
  sampleId,
  pendingSampleDisplay,
  onCollect,
  // High complexity is necessary for comprehensive modal content with multiple conditional sections and state management
  // eslint-disable-next-line complexity
}) => {
  const { getUserName } = useUserLookup();
  const { getSample } = useSampleLookup();
  const { getTest } = useTestNameLookup();
  const { getPatientName } = usePatientNameLookup();
  const { getOrder } = useOrderLookup();
  const { tests } = useTestCatalog();
  const rejectSampleMutation = useRejectSample();

  const sample = sampleId ? getSample(sampleId) : pendingSampleDisplay?.sample;
  const order = pendingSampleDisplay?.order || (sample ? getOrder(sample.orderId) : undefined);
  const requirement = pendingSampleDisplay?.requirement;

  const testDetails = useMemo(() => {
    if (!sample?.testCodes) return [];
    const seen = new Set<string>();
    return sample.testCodes
      .map(code => getTest(code))
      .filter((test): test is NonNullable<typeof test> => test !== undefined)
      .filter(test => {
        if (seen.has(test.code)) return false;
        seen.add(test.code);
        return true;
      });
  }, [sample, getTest]);

  if (!sample) return null;

  const isPending = sample.status === 'pending';
  const isRejected = sample.status === 'rejected';
  const isCollected = sample.status === 'collected';
  const rejectedSample = isRejected ? (sample as RejectedSample) : null;

  const patientId = order?.patientId || 0;
  const patientName = order ? getPatientName(order.patientId) : 'Unknown';
  const orderId = sample.orderId;
  const testNames = sample.testCodes ? getTestNames(sample.testCodes, tests) : [];

  const hasContainerInfo = (isCollected || isRejected) && 'actualContainerColor' in sample;
  const containerColor = hasContainerInfo ? sample.actualContainerColor : undefined;
  const colorName = containerColor
    ? CONTAINER_COLOR_OPTIONS.find(opt => opt.value === containerColor)?.name || 'N/A'
    : 'N/A';
  const containerType =
    hasContainerInfo && 'actualContainerType' in sample ? sample.actualContainerType : undefined;
  const effectiveContainerType: ContainerType =
    containerType ||
    (sample.sampleType === 'urine' || sample.sampleType === 'stool' ? 'cup' : 'tube');

  // Handle reject sample
  const handleReject = async (
    reasons: RejectionReason[],
    notes?: string,
    requireRecollection?: boolean
  ) => {
    if (!sample.sampleId) return;
    try {
      await rejectSampleMutation.mutateAsync({
        sampleId: sample.sampleId.toString(),
        reasons,
        notes,
        requireRecollection,
      });
      toast.success(
        requireRecollection ? 'Sample rejected - recollection will be requested' : 'Sample rejected'
      );
      onClose();
    } catch (error) {
      logger.error('Failed to reject sample', error instanceof Error ? error : undefined);
      toast.error('Failed to reject sample');
    }
  };

  // Collection info for collected/rejected samples
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
    <CollectionDetailHeaderBadges
      sample={sample}
      isPending={isPending}
      isRejected={isRejected}
      isCollected={isCollected}
      rejectedSample={rejectedSample}
      containerColor={containerColor}
      effectiveContainerType={effectiveContainerType}
      colorName={colorName}
    />
  );

  // Build footer content
  const footerContent = (
    <CollectionDetailFooter
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
      onReject={handleReject}
      onClose={onClose}
    />
  );

  // Build grid sections
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
    <LabDetailModal
      isOpen={isOpen}
      onClose={onClose}
      title={<span className="font-mono text-brand tracking-wide">{displayId.sample(sample.sampleId)}</span>}
      subtitle={`${patientName} - ${sample.sampleType.toUpperCase()}`}
      headerBadges={headerBadges}
      contextInfo={{ patientName, patientId, orderId }}
      footer={footerContent}
      additionalContextInfo={
        <>
          {/* Barcode */}
          {(isCollected || isRejected) && sample.sampleId && (
            <div className="flex items-center justify-center bg-app-bg rounded p-4 border border-border mt-2">
              <Barcode
                value={displayId.sample(sample.sampleId)}
                height={40}
                displayValue={false}
                background="transparent"
                margin={0}
              />
            </div>
          )}
          {/* Collection info */}
          {collectedAt && (
            <CollectionInfoLine
              collectedAt={collectedAt}
              collectedBy={collectedBy}
              className="text-xs text-text-tertiary mt-1"
            />
          )}
        </>
      }
    >
      <CollectionDetailContent
        sample={sample}
        isPending={isPending}
        isRejected={isRejected}
        isCollected={isCollected}
        rejectedSample={rejectedSample}
        testNames={testNames}
        testDetails={testDetails}
        testCodes={sample.testCodes || []}
        getTest={getTest}
        getUserName={getUserName}
        collectionNotes={collectionNotes}
        collectedAt={collectedAt}
        collectedBy={collectedBy}
        gridSections={gridSections}
      />
    </LabDetailModal>
  );
};
