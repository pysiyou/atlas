/**
 * CollectionDetailContent Component
 * Renders the main content sections of the collection detail modal
 */

import React from 'react';
import { Icon, SectionPanel } from '@/components';
import type { Sample, RejectedSample, Test } from '@/types';
import { CollectionRequirementsSection } from './CollectionRequirementsSection';
import { DetailGrid, type DetailGridSectionConfig } from '../components/LabDetailModal';
import { formatDate } from '@/utils';
import { formatRejectionReasons } from '../utils/labFormatters';
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

export const CollectionDetailContent: React.FC<CollectionDetailContentProps> = ({
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

      {isRejected && rejectedSample && (
        <SectionPanel title="Rejection Details">
          <div className="space-y-2 text-sm text-text-secondary">
            {rejectedSample.rejectionReasons && rejectedSample.rejectionReasons.length > 0 && (
              <p>
                <span className="text-text-tertiary">Reason: </span>
                {formatRejectionReasons(rejectedSample.rejectionReasons)}
              </p>
            )}
            {rejectedSample.rejectionNotes && (
              <p>
                <span className="text-text-tertiary">Notes: </span>
                {rejectedSample.rejectionNotes}
              </p>
            )}
            <p>
              <span className="text-text-tertiary">Rejected by </span>
              {getUserName(rejectedSample.rejectedBy)}
              <span className="text-text-tertiary"> on </span>
              {formatDate(rejectedSample.rejectedAt)}
            </p>
            {rejectedSample.recollectionRequired && (
              <p className="text-warning-fg">Recollection required</p>
            )}
          </div>
        </SectionPanel>
      )}

      {isPending && testDetails.length > 0 && (
        <CollectionRequirementsSection testDetails={testDetails} />
      )}

      {collectionNotes && (
        <SectionPanel title="Collection Notes">
          <div className="text-sm text-text-primary">{collectionNotes}</div>
        </SectionPanel>
      )}

      <DetailGrid sections={gridSections} />
    </>
  );
};
