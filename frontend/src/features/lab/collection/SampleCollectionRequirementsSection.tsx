/**
 * SampleCollectionRequirementsSection - Collection requirements with tabs for each test
 */

import React, { useMemo } from 'react';
import { RADIUS } from '@/theme/recipes';
import { Callout } from '@/components/display';
import { RecordId } from '@/features/shared/components';
import { Panel } from '@/components/surfaces';
import { SegmentedControl } from '@/components/inputs/SegmentedControl';
import { Text } from '@/components/layout/Text';
import { formatArray } from '@/utils';
import { formatRejectionCriteriaList } from '../utils/catalogRejectionCriteria';

/** Test detail for requirements display */
export interface TestDetail {
  code: string;
  fastingRequired?: boolean;
  containerDescription?: string;
  collectionNotes?: string;
  rejectionCriteria?: Array<string | { reason: string; domain?: string; label?: string }>;
  minimumVolume?: number;
}

interface CollectionRequirementsSectionProps {
  testDetails: TestDetail[];
}

/**
 * Requirements section with tabs for each test
 * Displays collection requirements, fasting info, and rejection criteria
 */
export const SampleCollectionRequirementsSection: React.FC<CollectionRequirementsSectionProps> = ({
  testDetails,
}) => {
  const [activeTestCode, setActiveTestCode] = React.useState(testDetails[0]?.code || '');
  const activeTest = testDetails.find(t => t.code === activeTestCode) || testDetails[0];

  const segmentTabs = useMemo(
    () =>
      testDetails.map((test, index) => ({
        id: `${test.code}-${index}`,
        label: <RecordId>{test.code}</RecordId>,
      })),
    [testDetails]
  );

  const activeSegmentId =
    segmentTabs.find((_tab, index) => testDetails[index]?.code === activeTestCode)?.id ??
    segmentTabs[0]?.id ??
    '';

  if (!activeTest) return null;

  return (
    <Panel
      preset="panel.compact.standard" title="Collection Requirements & Instructions"
      headerEnd={
        testDetails.length > 1 ? (
          <SegmentedControl
            options={segmentTabs}
            activeId={activeSegmentId}
            onActiveIdChange={id => {
              const index = segmentTabs.findIndex(tab => tab.id === id);
              const test = testDetails[index];
              if (test) setActiveTestCode(test.code);
            }}
          />
        ) : undefined
      }
    >
      <div className="space-y-space-3 pt-space-2 animate-in fade-in duration-200">
        {activeTest.fastingRequired && (
          <Callout variant="warning" title="Fasting Required">
            Patient must fast before sample collection. Verify fasting status before proceeding.
          </Callout>
        )}

        {activeTest.containerDescription && (
          <div className="flex items-start gap-space-2">
            <span className={`w-1.5 h-1.5 ${RADIUS.pill} bg-text-muted mt-space-1-5 shrink-0`} />
            <div className="flex-1">
              <Text as="div" role="label" className="mb-space-1">Container Specifications</Text>
              <Text as="div" role="body">{activeTest.containerDescription}</Text>
            </div>
          </div>
        )}

        {activeTest.collectionNotes && (
          <div className="flex items-start gap-space-2">
            <span className={`w-1.5 h-1.5 ${RADIUS.pill} bg-text-muted mt-space-1-5 shrink-0`} />
            <div className="flex-1">
              <Text as="div" role="label" className="mb-space-1">Collection Instructions</Text>
              <Text as="div" role="body">{activeTest.collectionNotes}</Text>
            </div>
          </div>
        )}

        {activeTest.rejectionCriteria && activeTest.rejectionCriteria.length > 0 && (
          <div className="flex items-start gap-space-2">
            <span className={`w-1.5 h-1.5 ${RADIUS.pill} bg-text-muted mt-space-1-5 shrink-0`} />
            <div className="flex-1">
              <Text as="div" role="label" className="mb-space-1">Rejection Criteria</Text>
              <Text as="div" role="body">
                {formatArray(formatRejectionCriteriaList(activeTest.rejectionCriteria))}
              </Text>
            </div>
          </div>
        )}

        {activeTest.minimumVolume && (
          <div className="flex items-center gap-space-2">
            <Text role="label" className="font-normal">Minimum Volume:</Text>
            <Text role="body">{activeTest.minimumVolume} mL</Text>
          </div>
        )}
      </div>
    </Panel>
  );
};
