/**
 * SampleDetailModal - Extended view for sample details
 * 
 * Provides a full view of sample information including collection requirements,
 * rejection details, and linked tests.
 */

import React, { useMemo } from 'react';
import { Badge, Icon, DetailField, IconButton } from '@/shared/ui';
import type { ContainerType, RejectedSample } from '@/types';
import { REJECTION_REASON_CONFIG } from '@/types/enums/rejection-reason';
import Barcode from 'react-barcode';
import toast from 'react-hot-toast';
import { formatDate as formatDateTime } from '@/utils';
import { useUserDisplay } from '@/hooks';
import { CONTAINER_COLOR_OPTIONS } from '@/types';
import { getContainerIconColor, getCollectionRequirements } from '@/utils';
import { formatVolume, formatDate } from '@/utils';
import { printSampleLabel } from './SampleLabel';
import { SampleCollectionPopover } from './SampleCollectionPopover';
import { SampleRejectionPopover } from './SampleRejectionPopover';
import { useSamples, useTests, usePatients, useOrders } from '@/hooks';
import { getPatientName, getTestNames } from '@/utils/typeHelpers';
import { LabDetailModal, DetailSection, DetailGrid, StatusBadgeRow } from '../shared/LabDetailModal';
import type { SampleDisplay } from './types';
import { AlertCircle, Clock } from 'lucide-react';

/** Test detail for requirements display */
interface TestDetail {
  code: string;
  fastingRequired?: boolean;
  containerDescription?: string;
  collectionNotes?: string;
  rejectionCriteria?: string[];
  minimumVolume?: number;
}

interface SampleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  sampleId?: string;
  pendingSampleDisplay?: SampleDisplay;
  onCollect?: (display: SampleDisplay, volume: number, notes?: string, selectedColor?: string, containerType?: ContainerType) => void;
}

/** Requirements section with tabs for each test */
const RequirementsSection: React.FC<{ testDetails: TestDetail[] }> = ({ testDetails }) => {
  const [activeTestCode, setActiveTestCode] = React.useState(testDetails[0]?.code || '');
  const activeTest = testDetails.find(t => t.code === activeTestCode) || testDetails[0];

  if (!activeTest) return null;

  return (
    <DetailSection
      title="Collection Requirements & Instructions"
      headerRight={
        <div className="flex gap-1">
          {testDetails.map(test => (
            <button
              key={test.code}
              onClick={() => setActiveTestCode(test.code)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                activeTestCode === test.code
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {test.code}
            </button>
          ))}
        </div>
      }
    >
      <div className="space-y-3 pt-2 animate-in fade-in duration-200">
        {activeTest.fastingRequired && (
          <div className="flex items-start gap-2 p-2 bg-orange-50 border border-orange-200 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0" />
            <div className="flex-1">
              <div className="text-xs font-medium text-orange-900">Fasting Required</div>
              <div className="text-xs text-orange-700 mt-0.5">
                Patient must fast before sample collection. Verify fasting status before proceeding.
              </div>
            </div>
          </div>
        )}

        {activeTest.containerDescription && (
          <div className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 shrink-0" />
            <div className="flex-1">
              <div className="text-xs font-medium text-gray-700 mb-1">Container Specifications</div>
              <div className="text-xs text-gray-600">{activeTest.containerDescription}</div>
            </div>
          </div>
        )}

        {activeTest.collectionNotes && (
          <div className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 shrink-0" />
            <div className="flex-1">
              <div className="text-xs font-medium text-gray-700 mb-1">Collection Instructions</div>
              <div className="text-xs text-gray-600">{activeTest.collectionNotes}</div>
            </div>
          </div>
        )}

        {activeTest.rejectionCriteria && activeTest.rejectionCriteria.length > 0 && (
          <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded">
            <AlertCircle size={16} className="text-red-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="text-xs font-medium text-red-900 mb-1">Rejection Criteria</div>
              <ul className="list-disc list-inside space-y-0.5">
                {activeTest.rejectionCriteria.map((criteria, idx) => (
                  <li key={idx} className="text-xs text-red-700">{criteria}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTest.minimumVolume && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className="font-medium">Minimum Volume:</span>
            <span>{activeTest.minimumVolume} mL</span>
          </div>
        )}
      </div>
    </DetailSection>
  );
};

/** Rejection history section */
const RejectionSection: React.FC<{
  title: string;
  reasons?: string[];
  notes?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  recollectionRequired?: boolean;
  recollectionSampleId?: string;
  variant?: 'red' | 'yellow';
  getUserName: (id: string) => string;
}> = ({ title, reasons, notes, rejectedBy, rejectedAt, recollectionRequired, recollectionSampleId, variant = 'red', getUserName }) => {
  const bulletColor = variant === 'red' ? 'bg-red-500' : 'bg-yellow-500';
  const textColor = variant === 'red' ? 'text-red-700' : 'text-yellow-700';
  const notesColor = variant === 'red' ? 'text-red-600' : 'text-yellow-600';

  return (
    <DetailSection title={title}>
      <ul className="space-y-1">
        {reasons && (
          <li className={`flex items-center text-xs ${textColor}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${bulletColor} mr-2`} />
            <span className="font-medium">
              {reasons.map(r => REJECTION_REASON_CONFIG[r as keyof typeof REJECTION_REASON_CONFIG]?.label || r).join(', ')}
            </span>
          </li>
        )}
        {notes && (
          <li className={`flex items-center text-xs ${notesColor} italic`}>
            <span className={`w-1.5 h-1.5 rounded-full ${bulletColor} mr-2`} />
            "{notes}"
          </li>
        )}
        {rejectedBy && rejectedAt && (
          <li className="flex items-center text-xs text-gray-600">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-2" />
            <span>{getUserName(rejectedBy)} · {formatDate(rejectedAt)}</span>
          </li>
        )}
        {recollectionRequired && (
          <li className="flex items-center text-xs text-gray-600">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-2" />
            <span>Recollection required</span>
          </li>
        )}
        {recollectionSampleId && (
          <li className="flex items-center text-xs text-gray-600">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-2" />
            <span>Recollection sample: <span className="font-mono font-medium">{recollectionSampleId}</span></span>
          </li>
        )}
      </ul>
    </DetailSection>
  );
};

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
    </>
  );

  // Build action buttons
  const actionButtons = (
    <div className="flex items-center gap-2">
      {isCollected ? (
        <>
          <IconButton onClick={handlePrintLabel} icon={<Icon name="printer" />} variant="primary" size="sm" title="Print Sample Label" />
          {sample.sampleId && !sample.sampleId.includes('PENDING') && (
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
                  console.error('Failed to reject sample:', error);
                  toast.error('Failed to reject sample');
                }
              }}
            />
          )}
        </>
      ) : isRejected ? (
        rejectedSample?.recollectionSampleId && (
          <Badge size="sm" variant="info" className="flex items-center gap-1">
            <Icon name="check-circle" className="w-3 h-3" />
            Recollection: {rejectedSample.recollectionSampleId}
          </Badge>
        )
      ) : (
        requirement && onCollect && (
          <SampleCollectionPopover
            requirement={requirement}
            patientName={patientName}
            testName={testNames.join(', ')}
            isRecollection={sample.isRecollection || (sample.rejectionHistory && sample.rejectionHistory.length > 0)}
            onConfirm={handleCollectConfirm}
          />
        )
      )}
    </div>
  );

  return (
    <LabDetailModal
      isOpen={isOpen}
      onClose={onClose}
      title={sample.sampleId}
      subtitle={`${patientName} - ${sample.sampleType.toUpperCase()}`}
      headerBadges={
        <div className="flex items-center justify-between gap-3 flex-wrap w-full">
          <div className="flex items-center gap-3 flex-wrap">{headerBadges}</div>
          {actionButtons}
        </div>
      }
      contextInfo={{ patientName, patientId, orderId }}
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
        <RejectionSection
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
          <RejectionSection
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
      {isPending && testDetails.length > 0 && <RequirementsSection testDetails={testDetails} />}

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
