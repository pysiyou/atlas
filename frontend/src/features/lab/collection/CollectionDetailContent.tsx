/**
 * CollectionDetailContent Component
 * Renders the main content sections of the collection detail modal
 */

import React from 'react';
import { Icon, SectionPanel } from '@/components';
import type { Sample, RejectedSample, Test } from '@/types';
import { CollectionRequirementsSection } from './CollectionRequirementsSection';
import { RejectionHistorySection } from '../components/RejectionHistorySection';
import { DetailGrid, type DetailGridSectionConfig } from '../components/LabDetailModal';
import { ICONS } from '@/config/icons';

interface CollectionDetailContentProps {
  sample: Sample;
  isPending: boolean;
  isRejected: boolean;
  isCollected: boolean;
  rejectedSample: RejectedSample | null;
  testNames: string[];
  testDetails: Test[];
  testCodes: string[];
  getTest: (code: string) => Test | undefined;
  getUserName: (userId: string) => string;
  collectionNotes?: string;
  gridSections: DetailGridSectionConfig[];
}

/**
 * CollectionDetailContent Component
 * Renders all content sections of the collection detail modal
 */
export const CollectionDetailContent: React.FC<CollectionDetailContentProps> = ({
  sample,
  isPending,
  isRejected,
  isCollected,
  rejectedSample,
  testNames,
  testDetails,
  testCodes,
  getTest,
  getUserName,
  collectionNotes,
  gridSections,
}) => {
  return (
    <>
      {/* Linked Tests */}
      <SectionPanel title={isCollected ? 'Linked Tests' : 'Required for'}>
        <ul className="space-y-1">
          {testNames.map((testName, i) => {
            const testCode = testCodes[i];
            const test = testCode ? getTest(testCode) : undefined;
            return (
              <li key={testCode || i} className="flex items-center text-xs text-text-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 mr-2" />
                <span className="font-normal mr-1">{testName}</span>
                <span className="entity-id mr-2">{testCode}</span>
                {test?.turnaroundTime && (
                  <span className="text-text-disabled flex items-center gap-1">
                    <Icon name={ICONS.dataFields.time} className="w-2.5 h-2.5" />
                    {test.turnaroundTime}h
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </SectionPanel>

      {/* Rejection Details - for rejected samples */}
      {isRejected && rejectedSample && (
        <RejectionHistorySection
          variant="sample"
          title={`Rejection Details${(rejectedSample.rejectionHistory?.length || 1) > 1 ? ` (${rejectedSample.rejectionHistory?.length || 1} attempts)` : ''}`}
          reasons={rejectedSample.rejectionReasons}
          notes={rejectedSample.rejectionNotes}
          rejectedBy={rejectedSample.rejectedBy}
          rejectedAt={rejectedSample.rejectedAt}
          getUserName={getUserName}
        />
      )}

      {/* Previous Rejection History */}
      {!isRejected && sample.rejectionHistory && sample.rejectionHistory.length > 0 && (
        <RejectionHistorySection
          variant="sample"
          title={`Previous Rejection${sample.rejectionHistory.length > 1 ? ` (${sample.rejectionHistory.length} attempts)` : ''}`}
          rejectionHistory={sample.rejectionHistory}
          getUserName={getUserName}
        />
      )}

      {/* Requirements Section - pending only */}
      {isPending && testDetails.length > 0 && (
        <CollectionRequirementsSection testDetails={testDetails} />
      )}

      {/* Collection Notes */}
      {collectionNotes && (
        <SectionPanel title="Collection Notes">
          <div className="text-sm text-text-primary">{collectionNotes}</div>
        </SectionPanel>
      )}

      {/* Detail Sections */}
      <DetailGrid sections={gridSections} />
    </>
  );
};
