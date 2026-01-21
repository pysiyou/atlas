/**
 * SampleDetailModal - Extended view for sample details
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
import { Badge, Icon, Button, SectionContainer } from '@/shared/ui';
import type { ContainerType, RejectedSample } from '@/types';
import Barcode from 'react-barcode';
import toast from 'react-hot-toast';
import { logger } from '@/utils/logger';
import { CONTAINER_COLOR_OPTIONS } from '@/types';
import { getContainerIconColor, getCollectionRequirements, formatVolume } from '@/utils';
import { printSampleLabel } from './SampleLabel';
import { SampleCollectionPopover } from './SampleCollectionPopover';
import { SampleRejectionPopover } from './SampleRejectionPopover';
import { SampleRequirementsSection } from './SampleRequirementsSection';
import { SampleRejectionSection } from './SampleRejectionSection';
import { useSamples, useTests, usePatients, useOrders, useUserDisplay } from '@/hooks';
import { getPatientName, getTestNames } from '@/utils/typeHelpers';
import { LabDetailModal, DetailGrid, ModalFooter, StatusBadgeRow } from '../shared/LabDetailModal';
import type { DetailGridSectionConfig } from '../shared/LabDetailModal';
import { CollectionInfoLine } from '../shared/StatusBadges';
import type { SampleDisplay } from './types';
import { orderHasValidatedTests, getValidatedTestCount } from '@/features/order/utils';

interface SampleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  sampleId?: string;
  pendingSampleDisplay?: SampleDisplay;
  onCollect?: (display: SampleDisplay, volume: number, notes?: string, selectedColor?: string, containerType?: ContainerType) => void;
}

export const SampleDetailModal: React.FC<SampleDetailModalProps> = ({
  isOpen,
  onClose,
  sampleId,
  pendingSampleDisplay,
  onCollect,
}) => {
  const { getUserName } = useUserDisplay();
  const { getSample, rejectSample } = useSamples();
  const { getTest, tests } = useTests();
  const { patients } = usePatients();
  const { getOrder } = useOrders();

  const sample = sampleId ? getSample(sampleId) : pendingSampleDisplay?.sample;
  const order = pendingSampleDisplay?.order || (sample ? getOrder(sample.orderId) : undefined);
  const requirement = pendingSampleDisplay?.requirement;

  const testDetails = useMemo(() => {
    if (!sample?.testCodes) return [];
    return sample.testCodes
      .map(code => getTest(code))
      .filter((test): test is NonNullable<typeof test> => test !== undefined);
  }, [sample, getTest]);

  if (!sample) return null;

  const isPending = sample.status === 'pending';
  const isRejected = sample.status === 'rejected';
  const isCollected = sample.status === 'collected';
  const rejectedSample = isRejected ? (sample as RejectedSample) : null;

  const patientId = order?.patientId || 'Unknown';
  const patientName = order ? getPatientName(order.patientId, patients) : 'Unknown';
  const orderId = sample.orderId;
  const testNames = sample.testCodes ? getTestNames(sample.testCodes, tests) : [];

  const hasContainerInfo = (isCollected || isRejected) && 'actualContainerColor' in sample;
  const containerColor = hasContainerInfo ? sample.actualContainerColor : undefined;
  const colorName = containerColor
    ? CONTAINER_COLOR_OPTIONS.find(opt => opt.value === containerColor)?.name || 'N/A'
    : 'N/A';
  const containerType = hasContainerInfo && 'actualContainerType' in sample ? sample.actualContainerType : undefined;
  const effectiveContainerType: ContainerType = containerType ||
    (sample.sampleType === 'urine' || sample.sampleType === 'stool' ? 'cup' : 'tube');

  const handlePrintLabel = () => {
    if (!pendingSampleDisplay) return;
    try {
      printSampleLabel(pendingSampleDisplay, patientName);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to print label');
    }
  };

  const handleCollectConfirm = (volume: number, notes?: string, color?: string, ct?: ContainerType) => {
    if (!pendingSampleDisplay || !onCollect) return;
    onCollect(pendingSampleDisplay, volume, notes, color, ct);
    onClose();
  };

  // Build header badges
  const headerBadges = (
    <>
      {(isCollected || isRejected) && containerColor && (
        <span className="flex items-center" title={`Container: ${effectiveContainerType}, Color: ${colorName}`}>
          <Icon
            name={effectiveContainerType === 'cup' ? 'lab-cup' : 'lab-tube'}
            className={`w-7 h-7 ${getContainerIconColor(containerColor)}`}
          />
        </span>
      )}
      <StatusBadgeRow sampleType={sample.sampleType} priority={sample.priority} />
      {getCollectionRequirements(sample.sampleType).isDerived && (
        <Badge size="sm" variant="default" className="text-gray-600">
          {getCollectionRequirements(sample.sampleType).label}
        </Badge>
      )}
      {(isCollected || isRejected) && 'collectedVolume' in sample && (
        <Badge size="sm" variant="default" className="text-gray-500">
          {formatVolume(sample.collectedVolume)} {isRejected ? 'was collected' : 'collected'}
        </Badge>
      )}
      <Badge size="sm" variant="default" className="text-gray-500">
        {formatVolume(sample.requiredVolume)} required
      </Badge>
      <Badge variant={isPending ? 'pending' : isRejected ? 'rejected' : 'collected'} size="sm" />
      {/* Show recollection badge in header for rejected samples */}
      {isRejected && rejectedSample?.recollectionSampleId && (
        <Badge size="sm" variant="info" className="flex items-center gap-1">
          <Icon name="check-circle" className="w-3 h-3" />
          Recollection: {rejectedSample.recollectionSampleId}
        </Badge>
      )}
    </>
  );

  /**
   * Build footer content with action buttons
   * - Pending: Show Collect button
   * - Collected: Show Print and Reject buttons
   * - Rejected: Show status message only
   * 
   * Button styles match ResultDetail modal pattern (size="md")
   */
  const footerContent = (() => {
    // For pending samples - show collect button
    if (isPending && requirement && onCollect) {
      const isRecollection = sample.isRecollection || (sample.rejectionHistory && sample.rejectionHistory.length > 0);
      return (
        <ModalFooter
          statusIcon={<Icon name="flask" className="w-4 h-4 text-gray-400" />}
          statusMessage="Sample pending collection"
          statusClassName="text-gray-500"
        >
          <SampleCollectionPopover
            requirement={requirement}
            patientName={patientName}
            testName={testNames.join(', ')}
            isRecollection={isRecollection}
            onConfirm={handleCollectConfirm}
            trigger={
              <Button
                variant="primary"
                size="md"
                icon={<Icon name="flask" />}
              >
                {isRecollection ? 'Recollect Sample' : 'Collect Sample'}
              </Button>
            }
          />
        </ModalFooter>
      );
    }

    // For collected samples - show print and reject buttons
    if (isCollected && sample.sampleId && !sample.sampleId.includes('PENDING')) {
      // Check if sample rejection should be blocked due to validated tests in the order
      const hasValidatedTests = order ? orderHasValidatedTests(order) : false;
      const validatedCount = order ? getValidatedTestCount(order) : 0;

      return (
        <ModalFooter
          statusIcon={<Icon name="check-circle" className="w-4 h-4 text-gray-400" />}
          statusMessage={hasValidatedTests 
            ? `Cannot reject - ${validatedCount} test${validatedCount > 1 ? 's' : ''} already validated`
            : "Sample collected successfully"
          }
          statusClassName={hasValidatedTests ? "text-amber-600" : "text-gray-500"}
        >
          <Button
            onClick={handlePrintLabel}
            variant="print"
            size="md"
          >
            Print Label
          </Button>
          {/* Block sample rejection if order has validated tests to prevent contradiction */}
          {hasValidatedTests ? (
            <Button
              variant="reject"
              size="md"
              disabled
              title={`Cannot reject sample: ${validatedCount} test${validatedCount > 1 ? 's have' : ' has'} already been validated`}
            >
              Reject Sample
            </Button>
          ) : (
            <SampleRejectionPopover
              sampleId={sample.sampleId}
              sampleType={sample.sampleType}
              patientName={patientName}
              isRecollection={sample.isRecollection || false}
              rejectionHistoryCount={sample.rejectionHistory?.length || 0}
              onReject={async (reasons, notes, requireRecollection) => {
                try {
                  await rejectSample(sample.sampleId, reasons, notes, requireRecollection);
                  toast.success(requireRecollection ? 'Sample rejected - recollection will be requested' : 'Sample rejected');
                  onClose();
                } catch (error) {
                  logger.error('Failed to reject sample', error instanceof Error ? error : undefined);
                  toast.error('Failed to reject sample');
                }
              }}
              trigger={
                <Button
                  variant="reject"
                  size="md"
                >
                  Reject Sample
                </Button>
              }
            />
          )}
        </ModalFooter>
      );
    }

    // For rejected samples - show status only, no action buttons
    if (isRejected) {
      return (
        <ModalFooter
          statusIcon={<Icon name="close-circle" className="w-4 h-4 text-gray-400" />}
          statusMessage={rejectedSample?.recollectionRequired ? 'Sample rejected - recollection requested' : 'Sample rejected'}
          statusClassName="text-gray-500"
        />
      );
    }

    return null;
  })();

  // Collection info for collected/rejected samples
  const collectedAt = (isCollected || isRejected) && 'collectedAt' in sample ? sample.collectedAt : undefined;
  const collectedBy = (isCollected || isRejected) && 'collectedBy' in sample ? sample.collectedBy : undefined;
  const collectedVolume = (isCollected || isRejected) && 'collectedVolume' in sample ? sample.collectedVolume : undefined;
  const remainingVolume = (isCollected || isRejected) && 'remainingVolume' in sample ? sample.remainingVolume : undefined;
  const collectionNotes = (isCollected || isRejected) && 'collectionNotes' in sample ? sample.collectionNotes : undefined;

  /**
   * Build dynamic grid sections based on sample status
   * Uses the declarative sections config pattern
   */
  const buildGridSections = (): DetailGridSectionConfig[] => {
    const sections: DetailGridSectionConfig[] = [];

    // Collection Details - collected/rejected only
    if ((isCollected || isRejected) && collectedAt) {
      sections.push({
        title: "Collection Details",
        fields: [
          { label: "Collected", timestamp: collectedAt },
          { label: "Collected By", value: collectedBy ? getUserName(collectedBy) : undefined },
          { 
            label: "Container", 
            value: (
              <div className="flex items-center gap-2">
                <Badge size="sm" variant="primary" className="capitalize">{effectiveContainerType}</Badge>
                {containerColor && <Badge size="sm" variant={`container-${containerColor}` as never}>{colorName} Top</Badge>}
              </div>
            )
          },
        ]
      });
    }

    // Volume Tracking - always shown
    sections.push({
      title: "Volume Tracking",
      fields: [
        { label: "Required", value: formatVolume(sample.requiredVolume) },
        { label: "Collected", value: collectedVolume !== undefined ? formatVolume(collectedVolume) : undefined },
        { 
          label: "Remaining", 
          value: remainingVolume !== undefined ? (
            <span className={remainingVolume < sample.requiredVolume * 0.2 ? 'text-red-600' : ''}>
              {formatVolume(remainingVolume)}
            </span>
          ) : undefined
        },
      ]
    });

    // Collection Requirements - pending only
    if (isPending && requirement) {
      sections.push({
        title: "Collection Requirements",
        fields: [
          { label: "Priority", badge: sample.priority ? { value: sample.priority, variant: sample.priority } : undefined },
          { 
            label: "Required Container Types", 
            value: requirement.containerTypes.length > 0 ? (
              <div className="flex flex-wrap gap-1 justify-end">
                {requirement.containerTypes.map((type, idx) => (
                  <Badge key={idx} size="sm" variant="primary" className="capitalize">{type}</Badge>
                ))}
              </div>
            ) : undefined
          },
          { 
            label: "Required Container Colors", 
            value: requirement.containerTopColors.length > 0 ? (
              <div className="flex flex-wrap gap-1 justify-end">
                {requirement.containerTopColors.map((color, idx) => (
                  <Badge key={idx} size="sm" variant={`container-${color}` as never}>
                    {CONTAINER_COLOR_OPTIONS.find(opt => opt.value === color)?.name || color} Top
                  </Badge>
                ))}
              </div>
            ) : undefined
          },
        ]
      });
    }

    // Audit Trail - collected/rejected only
    if (isCollected || isRejected) {
      sections.push({
        title: "Audit Trail",
        fields: [
          { label: "Created", timestamp: sample.createdAt },
          { label: "Created By", value: getUserName(sample.createdBy) },
          { label: "Last Updated", timestamp: sample.updatedAt },
          { label: "Updated By", value: sample.updatedBy ? getUserName(sample.updatedBy) : undefined },
        ]
      });
    }

    return sections;
  };

  return (
    <LabDetailModal
      isOpen={isOpen}
      onClose={onClose}
      title={sample.sampleId}
      subtitle={`${patientName} - ${sample.sampleType.toUpperCase()}`}
      headerBadges={headerBadges}
      contextInfo={{ patientName, patientId, orderId }}
      footer={footerContent}
      additionalContextInfo={
        <>
          {/* Barcode */}
          {(isCollected || isRejected) && sample.sampleId && !sample.sampleId.includes('PENDING') && (
            <div className="flex items-center justify-center bg-gray-50 rounded p-4 border border-gray-200 mt-2">
              <Barcode value={sample.sampleId} height={40} displayValue={false} background="transparent" margin={0} />
            </div>
          )}
          {/* Collection info - using centralized component */}
          {collectedAt && (
            <CollectionInfoLine 
              collectedAt={collectedAt} 
              collectedBy={collectedBy} 
              className="text-xs text-gray-500 mt-1"
            />
          )}
        </>
      }
    >
      {/* Linked Tests - custom section with list */}
      <SectionContainer title={isCollected ? 'Linked Tests' : 'Required for'}>
        <ul className="space-y-1">
          {testNames.map((testName, i) => {
            const testCode = sample.testCodes[i];
            const test = testCode ? getTest(testCode) : undefined;
            return (
              <li key={testCode || i} className="flex items-center text-xs text-gray-700">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-2" />
                <span className="font-medium mr-1">{testName}</span>
                <span className="text-gray-500 mr-2">{testCode}</span>
                {test?.turnaroundTime && (
                  <span className="text-gray-400 flex items-center gap-1">
                    <Icon name="clock" className="w-2.5 h-2.5" />
                    {test.turnaroundTime}h
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </SectionContainer>

      {/* Rejection Details - for rejected samples */}
      {isRejected && rejectedSample && (
        <SampleRejectionSection
          title={`Rejection Details${(rejectedSample.rejectionHistory?.length || 1) > 1 ? ` (${rejectedSample.rejectionHistory?.length || 1} attempts)` : ''}`}
          reasons={rejectedSample.rejectionReasons}
          notes={rejectedSample.rejectionNotes}
          rejectedBy={rejectedSample.rejectedBy}
          rejectedAt={rejectedSample.rejectedAt}
          getUserName={getUserName}
        />
      )}

      {/* Previous Rejection History - shows tabs for multiple rejections */}
      {!isRejected && sample.rejectionHistory && sample.rejectionHistory.length > 0 && (
        <SampleRejectionSection
          title={`Previous Rejection${sample.rejectionHistory.length > 1 ? ` (${sample.rejectionHistory.length} attempts)` : ''}`}
          rejectionHistory={sample.rejectionHistory}
          getUserName={getUserName}
        />
      )}

      {/* Requirements Section - pending only */}
      {isPending && testDetails.length > 0 && <SampleRequirementsSection testDetails={testDetails} />}

      {/* Collection Notes - shown separately if present */}
      {collectionNotes && (
        <SectionContainer title="Collection Notes">
          <div className="text-sm text-gray-900">{collectionNotes}</div>
        </SectionContainer>
      )}

      {/* Detail Sections - using declarative sections config */}
      <DetailGrid sections={buildGridSections()} />
    </LabDetailModal>
  );
};
