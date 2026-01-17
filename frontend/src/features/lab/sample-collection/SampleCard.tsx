import React from 'react';
import { Badge, Icon, IconButton } from '@/shared/ui';
import Barcode from 'react-barcode';
import type { ContainerType } from '@/types';

import { getContainerIconColor, getCollectionRequirements } from '@/utils';
import { formatVolume } from '@/utils';
import { usePatients, useTests, useSamples, useAuth } from '@/hooks';
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
  const { currentUser } = useAuth();

  const { sample, order, requirement } = display;
  
  if (!sample || !requirement) {
    return null; // Don't render if essential data is missing
  }
  
  const patientName = getPatientName(order.patientId, patients);
  const testNames = requirement.testCodes ? getTestNames(requirement.testCodes, tests) : [];
  
  const isPending = sample.status === 'pending';
  const isCollected = !isPending;

  // Get color name for display
  const containerColor = isCollected && 'actualContainerColor' in sample ? sample.actualContainerColor : undefined;


  const colorName = containerColor
    ? CONTAINER_COLOR_OPTIONS.find(opt => opt.value === containerColor)?.name || 'N/A'
    : 'N/A';

  // Determine container type
  const containerType = isCollected && 'actualContainerType' in sample ? sample.actualContainerType : undefined;
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

    // Open modal for collected samples
    if (isCollected && sample.sampleId && !sample.sampleId.includes('PENDING')) {
      openModal(ModalType.SAMPLE_DETAIL, { sampleId: sample.sampleId });
    }
    // Open modal for pending samples
    else if (isPending) {
      openModal(ModalType.SAMPLE_DETAIL, { pendingSampleDisplay: display, onCollect });
    }
  };

  const collectedVolume = isCollected && 'collectedVolume' in sample ? sample.collectedVolume : undefined;
  const collectedAt = isCollected && 'collectedAt' in sample ? sample.collectedAt : undefined;
  const collectedBy = isCollected && 'collectedBy' in sample ? sample.collectedBy : undefined;

  // Badge elements for Row 1 (left side) - ordered by importance for sample handling
  const badges = (
    <>
      {/* 1. Patient name - most important for patient safety */}
      <h3 className="text-sm font-medium text-gray-900">{patientName}</h3>

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
          : `${formatVolume(collectedVolume!)} collected`}
      </Badge>

      {/* 5. Container icon - visual confirmation (only for collected) */}
      {isCollected && containerColor && (
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

      {/* 7. Barcode - for automated identification (only for collected) */}
      {isCollected && sample.sampleId && !sample.sampleId.includes('PENDING') && (
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
        <SampleCollectionPopover
          requirement={requirement}
          patientName={patientName}
          testName={testNames.join(', ')}
          onConfirm={(volume, notes, color, containerType) => {
            handleConfirm(volume, notes, color, containerType);
          }}
        />
      ) : (
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
                    currentUser?.id || 'unknown',
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

  const content = <TestList tests={testListItems} />;

  return (
    <LabCard
      onClick={handleCardClick}
      context={{
        orderId: order.orderId,
        referringPhysician: order.referringPhysician,
      }}
      sampleInfo={
        isCollected && sample.sampleId
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
