import React from 'react';
import { Badge, Icon, IconButton } from '@/shared/ui';
import Barcode from 'react-barcode';
import type { ContainerType, RejectedSample } from '@/types';
import { REJECTION_REASON_CONFIG } from '@/types/enums/rejection-reason';

import { getContainerIconColor, getCollectionRequirements } from '@/utils';
import { formatVolume } from '@/utils';
import { usePatients, useTests, useSamples } from '@/hooks';
import { CONTAINER_COLOR_OPTIONS } from '@/types';
import toast from 'react-hot-toast';
import { useModal, ModalType } from '@/shared/contexts/ModalContext';
import { printSampleLabel } from './SampleLabel';
import { getPatientName, getTestNames } from '@/utils/typeHelpers';
import type { SampleDisplay } from './types';
import { SampleCollectionPopover } from './SampleCollectionPopover';
import { SampleRejectionPopover } from './SampleRejectionPopover';
import { LabCard, TestList } from '../shared/LabCard';

interface SampleCardProps {
  display: SampleDisplay;
  onCollect: (display: SampleDisplay, volume: number, notes?: string, selectedColor?: string, containerType?: ContainerType) => void;
}

/**
 * Handles printing the sample label
 */
const handlePrintLabel = (display: SampleDisplay, patientName: string): void => {
  try {
    printSampleLabel(display, patientName);
  } catch (error) {
    if (error instanceof Error) {
      toast.error(error.message);
    } else {
      toast.error('Failed to print label');
    }
  }
};

export const SampleCard: React.FC<SampleCardProps> = ({
  display,
  onCollect,
}) => {
  const { openModal } = useModal();
  const { patients } = usePatients();
  const { tests } = useTests();
  const { rejectSample } = useSamples();

  const { sample, order, requirement } = display;
  
  if (!sample || !requirement) {
    return null; // Don't render if essential data is missing
  }
  
  const patientName = getPatientName(order.patientId, patients);
  const testNames = requirement.testCodes ? getTestNames(requirement.testCodes, tests) : [];
  
  // Determine sample status
  const isPending = sample.status === 'pending';
  const isRejected = sample.status === 'rejected';
  const isCollected = sample.status === 'collected';
  
  // Type guard for rejected sample properties
  const rejectedSample = isRejected ? (sample as RejectedSample) : null;

  // Get color name for display (available for collected and rejected samples)
  const hasContainerInfo = (isCollected || isRejected) && 'actualContainerColor' in sample;
  const containerColor = hasContainerInfo ? sample.actualContainerColor : undefined;

  const colorName = containerColor
    ? CONTAINER_COLOR_OPTIONS.find(opt => opt.value === containerColor)?.name || 'N/A'
    : 'N/A';

  // Determine container type
  const containerType = hasContainerInfo && 'actualContainerType' in sample ? sample.actualContainerType : undefined;
  const effectiveContainerType: ContainerType = containerType ||
    (sample.sampleType === 'urine' || sample.sampleType === 'stool' ? 'cup' : 'tube');

  const handleConfirm = (volume: number, notes?: string, color?: string, containerType?: ContainerType) => {
    onCollect(display, volume, notes, color, containerType);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open modal if clicking on buttons or forms
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('input') ||
      target.closest('form') ||
      target.closest('[data-popover-content]')
    ) {
      return;
    }

    // Open modal for collected or rejected samples
    if ((isCollected || isRejected) && sample.sampleId && !sample.sampleId.includes('PENDING')) {
      openModal(ModalType.SAMPLE_DETAIL, { sampleId: sample.sampleId });
    }
    // Open modal for pending samples
    else if (isPending) {
      openModal(ModalType.SAMPLE_DETAIL, { pendingSampleDisplay: display, onCollect });
    }
  };

  // Collection info is available for both collected and rejected samples
  const hasCollectionInfo = (isCollected || isRejected) && 'collectedVolume' in sample;
  const collectedVolume = hasCollectionInfo ? sample.collectedVolume : undefined;
  const collectedAt = hasCollectionInfo && 'collectedAt' in sample ? sample.collectedAt : undefined;
  const collectedBy = hasCollectionInfo && 'collectedBy' in sample ? sample.collectedBy : undefined;

  // Check if this is a recollection sample
  const isRecollection = sample.isRecollection === true;

  // Badge elements for Row 1 (left side) - ordered by importance for sample handling
  const badges = (
    <>
      {/* 1. Patient name - most important for patient safety */}
      <h3 className="text-sm font-medium text-gray-900">{patientName}</h3>

      {/* 1b. Recollection indicator - important for lab staff awareness */}
      {isRecollection && (
        <Badge size="sm" variant="warning" className="flex items-center gap-1">
          <Icon name="hourglass" className="w-3 h-3" />
          RECOLLECTION #{sample.recollectionAttempt || 2}
        </Badge>
      )}

      {/* 2. Priority - STAT samples need immediate attention */}
      {sample.priority && (
        <Badge variant={sample.priority} size="sm">
          {sample.priority.toUpperCase()}
        </Badge>
      )}

      {/* 3. Sample type - what kind of specimen */}
      <Badge variant={sample.sampleType} size="sm" />

      {/* 4. Volume - collection requirements */}
      <Badge size="sm" variant="default" className="text-gray-500">
        {isPending
          ? `${formatVolume(requirement.totalVolume)} required`
          : `${formatVolume(collectedVolume!)} ${isRejected ? 'was collected' : 'collected'}`}
      </Badge>

      {/* 4b. Recollection badge for rejected samples that have a new sample */}
      {isRejected && rejectedSample?.recollectionSampleId && (
        <Badge size="sm" variant="info">
          Recollection: {rejectedSample.recollectionSampleId}
        </Badge>
      )}

      {/* 5. Container icon - visual confirmation (for collected and rejected) */}
      {(isCollected || isRejected) && containerColor && (
        <span
          className="flex items-center"
          title={`Container: ${effectiveContainerType}, Color: ${colorName}`}
        >
          <Icon
            name={effectiveContainerType === 'cup' ? 'lab-cup' : 'lab-tube'}
            className={`w-6 h-6 ${getContainerIconColor(containerColor)}`}
          />
        </span>
      )}

      {/* 6. Collection instruction for derived types */}
      {getCollectionRequirements(sample.sampleType).isDerived && (
        <Badge size="sm" variant="default" className="text-gray-600">
          {getCollectionRequirements(sample.sampleType).label}
        </Badge>
      )}

      {/* 7. Barcode - for automated identification (for collected and rejected) */}
      {(isCollected || isRejected) && sample.sampleId && !sample.sampleId.includes('PENDING') && (
        <div className="flex items-center">
          <Barcode
            value={sample.sampleId}
            height={15}
            displayValue={false}
            background="transparent"
            margin={0}
          />
        </div>
      )}
    </>
  );

  // Action elements for Row 1 (right side)
  const actions = (
    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
      {isPending ? (
        // Pending: Show collect button
        <SampleCollectionPopover
          requirement={requirement}
          patientName={patientName}
          testName={testNames.join(', ')}
          onConfirm={(volume, notes, color, containerType) => {
            handleConfirm(volume, notes, color, containerType);
          }}
        />
      ) : isRejected ? (
        // Rejected: Show rejection badge and info
        <>
          <Badge size="sm" variant="error">
            REJECTED
          </Badge>
          {rejectedSample?.recollectionRequired && !rejectedSample?.recollectionSampleId && (
            <Badge size="sm" variant="warning">
              Awaiting Recollection
            </Badge>
          )}
        </>
      ) : (
        // Collected: Show collected badge, print, and reject options
        <>
          <Badge size="sm" variant="success">
            COLLECTED
          </Badge>
          {sample.sampleId && !sample.sampleId.includes('PENDING') && (
            <IconButton
              onClick={() => handlePrintLabel(display, patientName)}
              icon={<Icon name="printer" />}
              variant="primary"
              size="sm"
              title="Print Sample Label"
            />
          )}
          {sample.sampleId && !sample.sampleId.includes('PENDING') && (
            <SampleRejectionPopover
              sampleId={sample.sampleId}
              sampleType={sample.sampleType}
              patientName={patientName}
              onReject={async (reasons, notes, requireRecollection) => {
                try {
                  await rejectSample(
                    sample.sampleId,
                    reasons,
                    notes,
                    requireRecollection
                  );
                  toast.success(
                    requireRecollection
                      ? 'Sample rejected - new collection ordered'
                      : 'Sample rejected'
                  );
                } catch (error) {
                  console.error('Failed to reject sample:', error);
                  toast.error('Failed to reject sample');
                }
              }}
            />
          )}
        </>
      )}
    </div>
  );

  // Test list content for Row 3
  const testListItems = testNames.map((name, i) => ({
    name,
    code: requirement.testCodes[i] || '',
  }));

  // Build content with rejection details or recollection info if applicable
  const content = (
    <>
      {/* Recollection info for samples that replace rejected ones */}
      {isRecollection && sample.recollectionReason && (
        <div className="mb-3 p-2 bg-amber-50 border border-amber-100 rounded-md">
          <div className="flex items-start gap-2">
            <Icon name="hourglass" className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-amber-800 mb-1">Recollection Required</div>
              <p className="text-xxs text-amber-700">
                Previous sample ({sample.originalSampleId}) was rejected: {sample.recollectionReason}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Rejection details for rejected samples */}
      {isRejected && rejectedSample && (
        <div className="mb-3 p-2 bg-red-50 border border-red-100 rounded-md">
          <div className="flex items-start gap-2">
            <Icon name="alert-circle" className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-red-800 mb-1">Rejection Reasons</div>
              <div className="flex flex-wrap gap-1 mb-1">
                {rejectedSample.rejectionReasons?.map((reason) => (
                  <Badge key={reason} size="sm" variant="error" className="text-xxs">
                    {REJECTION_REASON_CONFIG[reason]?.label || reason}
                  </Badge>
                ))}
              </div>
              {rejectedSample.rejectionNotes && (
                <p className="text-xxs text-red-700 italic">"{rejectedSample.rejectionNotes}"</p>
              )}
              <p className="text-xxs text-red-600 mt-1">
                Rejected by {rejectedSample.rejectedBy} on{' '}
                {new Date(rejectedSample.rejectedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}
      <TestList tests={testListItems} />
    </>
  );

  return (
    <LabCard
      onClick={handleCardClick}
      context={{
        orderId: order.orderId,
        referringPhysician: order.referringPhysician,
      }}
      sampleInfo={
        (isCollected || isRejected) && sample.sampleId
          ? {
              sampleId: sample.sampleId,
              collectedAt,
              collectedBy,
            }
          : undefined
      }
      badges={badges}
      actions={actions}
      content={content}
      contentTitle="Required for"
    />
  );
};
