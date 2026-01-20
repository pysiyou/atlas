/**
 * SampleDetailModal - Extended view for sample details
 * 
 * Provides a full view of sample information including collection requirements,
 * rejection details, and linked tests.
 */

import React, { useMemo } from 'react';
import { Badge, Icon, DetailField, Button } from '@/shared/ui';
import type { ContainerType, RejectedSample } from '@/types';
import Barcode from 'react-barcode';
import toast from 'react-hot-toast';
import { logger } from '@/utils/logger';
import { formatDate as formatDateTime } from '@/utils';
import { useUserDisplay } from '@/hooks';
import { CONTAINER_COLOR_OPTIONS } from '@/types';
import { getContainerIconColor, getCollectionRequirements } from '@/utils';
import { formatVolume, formatDate } from '@/utils';
import { printSampleLabel } from './SampleLabel';
import { SampleCollectionPopover } from './SampleCollectionPopover';
import { SampleRejectionPopover } from './SampleRejectionPopover';
import { SampleRequirementsSection } from './SampleRequirementsSection';
import { SampleRejectionSection } from './SampleRejectionSection';
import { useSamples, useTests, usePatients, useOrders } from '@/hooks';
import { getPatientName, getTestNames } from '@/utils/typeHelpers';
import { LabDetailModal, DetailSection, DetailGrid, ModalFooter, StatusBadgeRow } from '../shared/LabDetailModal';
import type { SampleDisplay } from './types';
import { Clock, FlaskConical, XCircle, CheckCircle, Printer } from 'lucide-react';

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
          statusIcon={<FlaskConical size={16} className="text-yellow-500" />}
          statusMessage="Sample pending collection"
          statusClassName="text-gray-600"
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
                icon={<FlaskConical size={16} />}
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
      return (
        <ModalFooter
          statusIcon={<CheckCircle size={16} className="text-green-500" />}
          statusMessage="Sample collected successfully"
          statusClassName="text-green-600"
        >
          <Button
            onClick={handlePrintLabel}
            variant="outline"
            size="md"
            icon={<Printer size={16} />}
          >
            Print Label
          </Button>
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
                variant="danger"
                size="md"
                icon={<XCircle size={16} />}
              >
                Reject Sample
              </Button>
            }
          />
        </ModalFooter>
      );
    }

    // For rejected samples - show status only, no action buttons
    if (isRejected) {
      return (
        <ModalFooter
          statusIcon={<XCircle size={16} className="text-red-500" />}
          statusMessage={rejectedSample?.recollectionRequired ? 'Sample rejected - recollection requested' : 'Sample rejected'}
          statusClassName="text-red-600"
        />
      );
    }

    return null;
  })();

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
          {/* Collection info */}
          {(isCollected || isRejected) && 'collectedAt' in sample && sample.collectedAt && (
            <div className="text-xs text-gray-500 mt-1">
              Collected <span className="font-medium text-gray-700">{formatDate(sample.collectedAt)}</span>
              {sample.collectedBy && <span> by {getUserName(sample.collectedBy)}</span>}
            </div>
          )}
        </>
      }
    >
      {/* Rejection Details */}
      {isRejected && rejectedSample && (
        <SampleRejectionSection
          title={`Rejection Details${(rejectedSample.rejectionHistory?.length || 1) > 1 ? ` (${rejectedSample.rejectionHistory?.length || 1} attempts)` : ''}`}
          reasons={rejectedSample.rejectionReasons}
          notes={rejectedSample.rejectionNotes}
          rejectedBy={rejectedSample.rejectedBy}
          rejectedAt={rejectedSample.rejectedAt}
          recollectionRequired={rejectedSample.recollectionRequired}
          recollectionSampleId={rejectedSample.recollectionSampleId}
          getUserName={getUserName}
        />
      )}

      {/* Previous Rejection History */}
      {!isRejected && sample.rejectionHistory && sample.rejectionHistory.length > 0 && (() => {
        const lastRejection = sample.rejectionHistory[sample.rejectionHistory.length - 1];
        return (
          <SampleRejectionSection
            title={`Previous Rejection${sample.rejectionHistory.length > 1 ? ` (${sample.rejectionHistory.length} attempts)` : ''}`}
            reasons={lastRejection.rejectionReasons}
            notes={lastRejection.rejectionNotes}
            rejectedBy={lastRejection.rejectedBy}
            rejectedAt={lastRejection.rejectedAt}
            variant="yellow"
            getUserName={getUserName}
          />
        );
      })()}

      {/* Linked Tests */}
      <DetailSection title={isCollected ? 'Linked Tests' : 'Required for'}>
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
                    <Clock size={10} />
                    {test.turnaroundTime}h
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </DetailSection>

      {/* Requirements Section - pending only */}
      {isPending && testDetails.length > 0 && <SampleRequirementsSection testDetails={testDetails} />}

      {/* Detail Sections */}
      <DetailGrid>
        {/* Collection Details - collected/rejected */}
        {(isCollected || isRejected) && 'collectedAt' in sample && (
          <DetailSection title="Collection Details">
            <div className="space-y-2">
              {sample.collectedAt && <DetailField label="Collected" value={formatDateTime(sample.collectedAt)} />}
              {sample.collectedBy && <DetailField label="Collected By" value={getUserName(sample.collectedBy)} />}
              <DetailField
                label="Container"
                value={
                  <div className="flex items-center gap-2">
                    <Badge size="sm" variant="primary" className="capitalize">{effectiveContainerType}</Badge>
                    {containerColor && <Badge size="sm" variant={`container-${containerColor}` as never}>{colorName} Top</Badge>}
                  </div>
                }
              />
              {sample.collectionNotes && (
                <div className="pt-2 border-t border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">Notes</div>
                  <div className="text-sm text-gray-900">{sample.collectionNotes}</div>
                </div>
              )}
            </div>
          </DetailSection>
        )}

        {/* Volume Tracking */}
        <DetailSection title="Volume Tracking">
          <div className="space-y-2">
            <DetailField label="Required" value={formatVolume(sample.requiredVolume)} />
            {(isCollected || isRejected) && 'collectedVolume' in sample && (
              <DetailField label="Collected" value={formatVolume(sample.collectedVolume)} />
            )}
            {(isCollected || isRejected) && 'remainingVolume' in sample && sample.remainingVolume !== undefined && (
              <DetailField
                label="Remaining"
                value={
                  <span className={sample.remainingVolume < sample.requiredVolume * 0.2 ? 'text-red-600' : ''}>
                    {formatVolume(sample.remainingVolume)}
                  </span>
                }
              />
            )}
          </div>
        </DetailSection>

        {/* Requirements - pending only */}
        {isPending && requirement && (
          <DetailSection title="Collection Requirements">
            <div className="space-y-2">
              {sample.priority && <DetailField label="Priority" value={<Badge variant={sample.priority} size="sm" />} />}
              {requirement.containerTypes.length > 0 && (
                <DetailField
                  label="Required Container Types"
                  value={
                    <div className="flex flex-wrap gap-1 justify-end">
                      {requirement.containerTypes.map((type, idx) => (
                        <Badge key={idx} size="sm" variant="primary" className="capitalize">{type}</Badge>
                      ))}
                    </div>
                  }
                />
              )}
              {requirement.containerTopColors.length > 0 && (
                <DetailField
                  label="Required Container Colors"
                  value={
                    <div className="flex flex-wrap gap-1 justify-end">
                      {requirement.containerTopColors.map((color, idx) => (
                        <Badge key={idx} size="sm" variant={`container-${color}` as never}>
                          {CONTAINER_COLOR_OPTIONS.find(opt => opt.value === color)?.name || color} Top
                        </Badge>
                      ))}
                    </div>
                  }
                />
              )}
            </div>
          </DetailSection>
        )}

        {/* Audit Trail - collected/rejected */}
        {(isCollected || isRejected) && (
          <DetailSection title="Audit Trail">
            <div className="space-y-2">
              <DetailField label="Created" value={formatDateTime(sample.createdAt)} />
              <DetailField label="Created By" value={getUserName(sample.createdBy)} />
              <DetailField label="Last Updated" value={formatDateTime(sample.updatedAt)} />
              {sample.updatedBy && <DetailField label="Updated By" value={getUserName(sample.updatedBy)} />}
            </div>
          </DetailSection>
        )}
      </DetailGrid>
    </LabDetailModal>
  );
};
