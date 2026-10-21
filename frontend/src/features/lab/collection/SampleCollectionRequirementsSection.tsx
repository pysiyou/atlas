/**
 * SampleCollectionRequirementsSection - Collection requirements with tabs for each test
 */

import React, { useMemo } from 'react';
import { RADIUS, TYPE } from '@/theme/recipes';
import { Callout, EntityId } from '@/components/display';
import { Panel } from '@/components/surfaces';
import { PanelHeaderSegmentTabs } from '@/components/display/PanelHeaderSegmentTabs';
import { formatArray } from '@/utils';
import { formatRejectionCriteriaList } from '../utils/catalogRejectionCriteria';
import { LAB_CARD_TYPOGRAPHY } from '@/theme/recipes';

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
        label: <EntityId>{test.code}</EntityId>,
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
      preset="lab.modal.collectionRequirementsInstructions"
      headerEnd={
        testDetails.length > 1 ? (
          <PanelHeaderSegmentTabs
            tabs={segmentTabs}
            activeId={activeSegmentId}
            onTabChange={id => {
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
              <div className={`mb-space-1 ${LAB_CARD_TYPOGRAPHY.fieldLabel}`}>
                Container Specifications
              </div>
              <div className={LAB_CARD_TYPOGRAPHY.sectionContent}>{activeTest.containerDescription}</div>
            </div>
          </div>
        )}

        {activeTest.collectionNotes && (
          <div className="flex items-start gap-space-2">
            <span className={`w-1.5 h-1.5 ${RADIUS.pill} bg-text-muted mt-space-1-5 shrink-0`} />
            <div className="flex-1">
              <div className={`mb-space-1 ${LAB_CARD_TYPOGRAPHY.fieldLabel}`}>
                Collection Instructions
              </div>
              <div className={LAB_CARD_TYPOGRAPHY.sectionContent}>{activeTest.collectionNotes}</div>
            </div>
          </div>
        )}

        {activeTest.rejectionCriteria && activeTest.rejectionCriteria.length > 0 && (
          <div className="flex items-start gap-space-2">
            <span className={`w-1.5 h-1.5 ${RADIUS.pill} bg-text-muted mt-space-1-5 shrink-0`} />
            <div className="flex-1">
              <div className={`mb-space-1 ${LAB_CARD_TYPOGRAPHY.fieldLabel}`}>
                Rejection Criteria
              </div>
              <div className={LAB_CARD_TYPOGRAPHY.sectionContent}>
                {formatArray(formatRejectionCriteriaList(activeTest.rejectionCriteria))}
              </div>
            </div>
          </div>
        )}

        {activeTest.minimumVolume && (
          <div className={`flex items-center gap-space-2 ${TYPE.value}`}>
            <span className={`font-normal ${LAB_CARD_TYPOGRAPHY.fieldLabel}`}>Minimum Volume:</span>
            <span className={LAB_CARD_TYPOGRAPHY.fieldValue}>{activeTest.minimumVolume} mL</span>
          </div>
        )}
      </div>
    </Panel>
  );
};
