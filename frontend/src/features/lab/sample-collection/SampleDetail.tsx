/**
 * Sample Detail Modal - Simplified version
 */

import React, { useMemo } from 'react';
import { Modal } from '@/shared/ui/Modal';
import { Badge, Icon, SectionContainer, TabsList, useTabs, DetailField, IconButton } from '@/shared/ui';
import type { ContainerType } from '@/types';
import Barcode from 'react-barcode';
import toast from 'react-hot-toast';
import { formatDate as formatDateTime } from '@/utils';
import { useUserDisplay } from '@/hooks';
import { CONTAINER_COLOR_OPTIONS } from '@/types';
import { getContainerIconColor, getContainerColor, getCollectionRequirements } from '@/utils';
import { formatVolume, formatDate } from '@/utils';
import { printSampleLabel } from './SampleLabel';
import { SampleCollectionPopover } from './SampleCollectionPopover';
import { useSamples, useTests, usePatients, useOrders } from '@/hooks';
import { getPatientName, getTestNames } from '@/utils/typeHelpers';
import type { SampleDisplay } from './types';
import { AlertCircle, Clock } from 'lucide-react';

/**
 * Test detail information for requirements display
 */
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

/**
 * Reusable detail field component
 */




// Helper component to manage tabs state
const RequirementsSection: React.FC<{ testDetails: TestDetail[] }> = ({ testDetails }) => {
  const tabs = useMemo(() => testDetails.map(test => ({
    id: test.code,
    label: test.code,
    content: (
      <div className="space-y-3 pt-2">
        {/* Fasting requirement */}
        {test.fastingRequired && (
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

        {/* Container descriptions */}
        {test.containerDescription && (
          <div className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 shrink-0" />
            <div className="flex-1">
              <div className="text-xs font-medium text-gray-700 mb-1">Container Specifications</div>
              <div className="text-xs text-gray-600">{test.containerDescription}</div>
            </div>
          </div>
        )}

        {/* Collection notes */}
        {test.collectionNotes && (
          <div className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 shrink-0" />
            <div className="flex-1">
              <div className="text-xs font-medium text-gray-700 mb-1">Collection Instructions</div>
              <div className="text-xs text-gray-600">{test.collectionNotes}</div>
            </div>
          </div>
        )}

        {/* Rejection criteria */}
        {test.rejectionCriteria && test.rejectionCriteria.length > 0 && (
          <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded">
            <AlertCircle size={16} className="text-red-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="text-xs font-medium text-red-900 mb-1">Rejection Criteria</div>
              <ul className="list-disc list-inside space-y-0.5">
                {test.rejectionCriteria.map((criteria: string, idx: number) => (
                  <li key={idx} className="text-xs text-red-700">{criteria}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Minimum volume requirement */}
        {test.minimumVolume && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className="font-medium">Minimum Volume:</span>
            <span>
              {test.minimumVolume} mL
            </span>
          </div>
        )}
      </div>
    )
  })), [testDetails]);

  const { activeTabId, setActiveTabId, activeTab } = useTabs(tabs);

  return (
    <SectionContainer 
      title="Collection Requirements & Instructions"
      headerRight={
        <TabsList 
          tabs={tabs} 
          activeTabId={activeTabId} 
          onTabChange={setActiveTabId} 
          variant="pills"
          className="scale-90 origin-right" // Make tabs slightly smaller in header
        />
      }
    >
      <div className="animate-in fade-in duration-200">
        {activeTab.content}
      </div>
    </SectionContainer>
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
  const { getSample } = useSamples();
  const { getTest, tests } = useTests();
  const { patients } = usePatients();
  const { getOrder } = useOrders();

  // Get the sample from context if sampleId provided
  const sample = sampleId ? getSample(sampleId) : pendingSampleDisplay?.sample;
  
  // Get order - either from prop or fetch using sample's orderId
  const order = pendingSampleDisplay?.order || (sample ? getOrder(sample.orderId) : undefined);
  const requirement = pendingSampleDisplay?.requirement;

  // Get test details from catalog for enhanced requirements display
  const testDetails = useMemo(() => {
    if (!sample?.testCodes) return [];
    return sample.testCodes
      .map(code => getTest(code))
      .filter((test): test is NonNullable<typeof test> => test !== undefined);
  }, [sample, getTest]);



  if (!sample) {
    return null;
  }

  const isPending = sample.status === 'pending';
  const isCollected = !isPending;

  // Extract common fields - now properly using fetched order
  const patientId = order?.patientId || 'Unknown';
  const patientName = order ? getPatientName(order.patientId, patients) : 'Unknown';
  const orderId = sample.orderId;
  const testNames = sample.testCodes ? getTestNames(sample.testCodes, tests) : [];

  // Get color name for display
  const containerColor = isCollected && 'actualContainerColor' in sample ? sample.actualContainerColor : undefined;
  const colorName = containerColor
    ? CONTAINER_COLOR_OPTIONS.find(opt => opt.value === containerColor)?.name || 'N/A'
    : 'N/A';



  const containerType = isCollected && 'actualContainerType' in sample ? sample.actualContainerType : undefined;
  const effectiveContainerType: ContainerType = containerType ||
    (sample.sampleType === 'urine' || sample.sampleType === 'stool' ? 'cup' : 'tube');

  const handlePrintLabel = () => {
    if (!pendingSampleDisplay) return;
    try {
      printSampleLabel(pendingSampleDisplay, patientName);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to print label');
      }
    }
  };

  const handleCollectConfirm = (volume: number, notes?: string, color?: string, containerType?: ContainerType) => {
    if (!pendingSampleDisplay || !onCollect) return;
    onCollect(pendingSampleDisplay, volume, notes, color, containerType);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={sample.sampleId}
      subtitle={`${patientName} - ${sample.sampleType.toUpperCase()}`}
      size="3xl"
    >
      <div className="overflow-y-auto p-6 bg-gray-50 space-y-4">
        {/* Header Section */}
        <SectionContainer hideHeader>
          <div className="flex flex-col gap-4">
            {/* Row 1: Container icon and badges */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3 flex-wrap">
                {/* Container icon (only for collected) */}
                {isCollected && containerColor && (
                  <span
                    className="flex items-center"
                    title={`Container: ${effectiveContainerType}, Color: ${colorName}`}
                  >
                    <Icon
                      name={effectiveContainerType === 'cup' ? 'lab-cup' : 'lab-tube'}
                      className={`w-7 h-7 ${getContainerIconColor(containerColor)}`}
                    />
                  </span>
                )}

                {/* Sample type badge */}
                <Badge variant={sample.sampleType} size="sm" />

                {/* Collection instruction for derived types */}
                {getCollectionRequirements(sample.sampleType).isDerived && (
                  <Badge size="sm" variant="default" className="text-gray-600">
                    {getCollectionRequirements(sample.sampleType).label}
                  </Badge>
                )}

                {/* Volume badges */}
                {isCollected && 'collectedVolume' in sample && (
                  <Badge size="sm" variant="default" className="text-gray-500">
                    {formatVolume(sample.collectedVolume)} collected
                  </Badge>
                )}
                <Badge size="sm" variant="default" className="text-gray-500">
                  {formatVolume(sample.requiredVolume)} required
                </Badge>

                {/* Priority badge */}
                {sample.priority && (
                  <Badge variant={sample.priority} size="sm" />
                )}

                {/* Collection status badge */}
                <Badge variant={isPending ? 'pending' : 'collected'} size="sm">
                  {isPending ? 'PENDING COLLECTION' : 'COLLECTED'}
                </Badge>
              </div>

              {/* Action buttons */}
              {isCollected ? (
                <IconButton
                  onClick={handlePrintLabel}
                  icon={<Icon name="printer" />}
                  variant="primary"
                  size="sm"
                  title="Print Sample Label"
                />
              ) : (
                requirement && onCollect && (
                  <SampleCollectionPopover
                    requirement={requirement}
                    onConfirm={(volume, notes, color, containerType) => {
                      handleCollectConfirm(volume, notes, color, containerType);
                    }}
                  />
                )
              )}
            </div>

            {/* Barcode - only for collected samples */}
            {isCollected && sample.sampleId && !sample.sampleId.includes('PENDING') && (
              <div className="flex items-center justify-center bg-gray-50 rounded p-4 border border-gray-200">
                <Barcode
                  value={sample.sampleId}
                  height={40}
                  displayValue={false}
                  background="transparent"
                  margin={0}
                />
              </div>
            )}

            {/* Patient & Order context */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-sm text-gray-700 flex-wrap">
                <span className="font-semibold text-gray-900">{patientName}</span>
                <span className="text-gray-300">|</span>
                <span className="font-medium text-gray-900 text-xs">{patientId}</span>
                <span className="text-gray-300">|</span>
                <span className="font-medium text-gray-900 text-xs">{orderId}</span>
              </div>

              {/* Collection info */}
              {isCollected && 'collectedAt' in sample && sample.collectedAt && (
                <div className="text-xs text-gray-500">
                  Collected <span className="font-medium text-gray-700">{formatDate(sample.collectedAt)}</span>
                  {sample.collectedBy && <span> by {getUserName(sample.collectedBy)}</span>}
                </div>
              )}
            </div>
          </div>
        </SectionContainer>

        {/* Linked Tests Section */}
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
                      <Clock size={10} />
                      {test.turnaroundTime}h
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </SectionContainer>

        {/* Enhanced Requirements Section - only for pending samples */}
        {isPending && testDetails.length > 0 && (
          <RequirementsSection testDetails={testDetails} />
        )}

        {/* 2-column layout for details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Collection Details - only for collected samples */}
          {isCollected && 'collectedAt' in sample && (
            <SectionContainer title="Collection Details">
              <div className="space-y-2">
              {sample.collectedAt && (
                <DetailField label="Collected" value={formatDateTime(sample.collectedAt)} />
              )}
              {sample.collectedBy && (
                <DetailField label="Collected By" value={getUserName(sample.collectedBy)} />
              )}
              <DetailField
                label="Container"
                value={
                  <div className="flex items-center gap-2">
                    <Badge size="sm" variant="primary" className="capitalize">
                      {effectiveContainerType}
                    </Badge>
                    {containerColor && (
                      <Badge size="sm" className={`${getContainerColor(containerColor)} border-none text-white font-medium`}>
                        {colorName} Top
                      </Badge>
                    )}
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
            </SectionContainer>
          )}

          {/* Volume Information */}
          <SectionContainer title="Volume Tracking">
            <div className="space-y-2">
              <DetailField label="Required" value={formatVolume(sample.requiredVolume)} />
              {isCollected && 'collectedVolume' in sample && (
                <DetailField label="Collected" value={formatVolume(sample.collectedVolume)} />
              )}
              {isCollected && 'remainingVolume' in sample && sample.remainingVolume !== undefined && (
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
          </SectionContainer>

          {/* Requirements - only for pending samples */}
          {isPending && requirement && (
            <SectionContainer title="Collection Requirements">
              <div className="space-y-2">
              {sample.priority && (
                <DetailField label="Priority" value={
                  <Badge variant={sample.priority} size="sm" />
                } />
              )}
              {requirement.containerTypes.length > 0 && (
                <DetailField
                  label="Required Container Types"
                  value={
                    <div className="flex flex-wrap gap-1 justify-end">
                      {requirement.containerTypes.map((type, idx) => (
                        <Badge key={idx} size="sm" variant="primary" className="capitalize">
                          {type}
                        </Badge>
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
                        <Badge key={idx} size="sm" className={`${getContainerColor(color)} border-none text-white font-medium`}>
                          {CONTAINER_COLOR_OPTIONS.find(opt => opt.value === color)?.name || color}
                        </Badge>
                      ))}
                    </div>
                  }
                />
              )}
              </div>
            </SectionContainer>
          )}

          {/* Audit Trail - only for collected samples */}
          {isCollected && (
            <SectionContainer title="Audit Trail">
              <div className="space-y-2">
              <DetailField label="Created" value={formatDateTime(sample.createdAt)} />
              <DetailField label="Created By" value={getUserName(sample.createdBy)} />
              <DetailField label="Last Updated" value={formatDateTime(sample.updatedAt)} />
              {sample.updatedBy && (
                <DetailField label="Updated By" value={getUserName(sample.updatedBy)} />
              )}
              </div>
            </SectionContainer>
          )}
        </div>
      </div>
    </Modal>
  );
};
