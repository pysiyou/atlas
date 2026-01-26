/**
 * CollectionDetailContent Component
 * Renders the main content sections of the collection detail modal
 */

import React from 'react';
import { Icon, SectionContainer } from '@/shared/ui';
import Barcode from 'react-barcode';
import type { Sample, RejectedSample, Test } from '@/types';
import { displayId } from '@/utils/id-display';
import { CollectionRequirementsSection } from '../CollectionRequirementsSection';
import { CollectionRejectionSection } from '../CollectionRejectionSection';
import { CollectionInfoLine } from '../../components/StatusBadges';
import { DetailGrid, type DetailGridSectionConfig } from '../../components/LabDetailModal';
import { ICONS } from '@/utils/icon-mappings';

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
  collectedAt?: string;
  collectedBy?: string;
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
  collectedAt,
  collectedBy,
  gridSections,
}) => {
  return (
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

      {/* Linked Tests */}
      <SectionContainer title={isCollected ? 'Linked Tests' : 'Required for'}>
        <ul className="space-y-1">
          {testNames.map((testName, i) => {
            const testCode = testCodes[i];
            const test = testCode ? getTest(testCode) : undefined;
            return (
              <li key={testCode || i} className="flex items-center text-xs text-text-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 mr-2" />
                <span className="font-medium mr-1">{testName}</span>
                <span className="text-sky-600 font-mono mr-2">{testCode}</span>
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
      </SectionContainer>

      {/* Rejection Details - for rejected samples */}
      {isRejected && rejectedSample && (
        <CollectionRejectionSection
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
        <CollectionRejectionSection
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
        <SectionContainer title="Collection Notes">
          <div className="text-sm text-text-primary">{collectionNotes}</div>
        </SectionContainer>
      )}

      {/* Detail Sections */}
      <DetailGrid sections={gridSections} />
    </>
  );
};
