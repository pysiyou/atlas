/**
 * CollectionDetailModal - Extended view for sample details
 *
 * Provides a full view of sample information including collection requirements,
 * rejection details, and linked tests.
 *
 * Uses centralized components:
 * - DetailGrid with sections config for consistent layout
 * - SectionPanel for custom sections
 * - CollectionInfoLine for sample metadata
 */

import React, { useCallback, useMemo, useState } from 'react';
import type { ContainerType, RejectedSample } from '@/types';
import { CONTAINER_COLOR_OPTIONS } from '@/types';
import Barcode from 'react-barcode';
import { displayId } from '@/utils';
import { CollectionInfoLine } from '../components/StatusBadges';
import { CollectionDetailHeaderBadges } from './CollectionDetailHeaderBadges';
import { CollectionDetailFooter } from './CollectionDetailFooter';
import { buildCollectionDetailGridSections } from './CollectionDetailGridSections';
import { CollectionDetailContent } from './CollectionDetailContent';
import { useTestCatalog } from '@/features/catalog';
import { useUserLookup } from '@/lib/api/users.api';
import { usePatientNameLookup } from '@/features/patients';
import { useOrderLookup } from '@/features/orders';
import { useSampleLookup } from '@/features/lab/api/samples.api';
import { getTestNames } from '@/features/catalog/utils';
import { LabDetailModal } from '../components/LabDetailModal';
import type { SampleDisplay } from '@/features/lab/types';

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
  const { getPatientName } = usePatientNameLookup();
  const { getOrder } = useOrderLookup();
  const { tests = [] } = useTestCatalog();
  const [isPopoverSubmitting, setIsPopoverSubmitting] = useState(false);

  const getTest = useCallback((code: string) => tests.find(t => t.code === code), [tests]);

  const sample = sampleId ? getSample(sampleId) : pendingSampleDisplay?.sample;
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
    <LabDetailModal
      isOpen={isOpen}
      onClose={onClose}
      disableClose={isPopoverSubmitting}
      title={
        <span className="entity-id">
          {displayId.sample(sample.sampleId)}
        </span>
      }
      subtitle={`${patientName} - ${sample.sampleType.toUpperCase()}`}
      headerBadges={headerBadges}
      contextInfo={{
        patientName,
        patientId,
        orderId,
        referringPhysician: order?.referringPhysician,
      }}
      footer={footerContent}
      additionalContextInfo={
        <>
          {/* Barcode */}
          {(isCollected || isRejected) && sample.sampleId && (
            <div className="flex items-center justify-center bg-surface-page rounded p-4 border border-border-default mt-2">
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
        gridSections={gridSections}
      />
    </LabDetailModal>
  );
};
