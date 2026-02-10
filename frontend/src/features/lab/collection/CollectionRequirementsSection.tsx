/**
 * CollectionRequirementsSection - Collection requirements with tabs for each test
 */

import React from 'react';
import { CalloutCard, SectionContainer } from '@/shared/ui';

/** Test detail for requirements display */
export interface TestDetail {
  code: string;
  fastingRequired?: boolean;
  containerDescription?: string;
  collectionNotes?: string;
  rejectionCriteria?: string[];
  minimumVolume?: number;
}

interface CollectionRequirementsSectionProps {
  testDetails: TestDetail[];
}

/**
 * Requirements section with tabs for each test
 * Displays collection requirements, fasting info, and rejection criteria
 */
export const CollectionRequirementsSection: React.FC<CollectionRequirementsSectionProps> = ({
  testDetails,
}) => {
  const [activeTestCode, setActiveTestCode] = React.useState(testDetails[0]?.code || '');
  const activeTest = testDetails.find(t => t.code === activeTestCode) || testDetails[0];

  if (!activeTest) return null;

  return (
    <SectionContainer
      title="Collection Requirements & Instructions"
      headerRight={
        <div className="flex gap-1">
          {testDetails.map((test, index) => (
            <button
              key={`${test.code}-${index}`}
              onClick={() => setActiveTestCode(test.code)}
              className={`px-2 py-1 text-xs rounded transition-colors font-mono ${
                activeTestCode === test.code
                  ? 'bg-brand-muted text-brand font-normal'
                  : 'bg-neutral-100 text-brand hover:bg-neutral-200'
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
          <CalloutCard variant="warning" title="Fasting Required">
            Patient must fast before sample collection. Verify fasting status before proceeding.
          </CalloutCard>
        )}

        {activeTest.containerDescription && (
          <div className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 mt-1.5 shrink-0" />
            <div className="flex-1">
              <div className="text-xs font-normal text-fg-subtle mb-1">Container Specifications</div>
              <div className="text-xs text-fg-subtle">{activeTest.containerDescription}</div>
            </div>
          </div>
        )}

        {activeTest.collectionNotes && (
          <div className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 mt-1.5 shrink-0" />
            <div className="flex-1">
              <div className="text-xs font-normal text-fg-subtle mb-1">Collection Instructions</div>
              <div className="text-xs text-fg-subtle">{activeTest.collectionNotes}</div>
            </div>
          </div>
        )}

        {activeTest.rejectionCriteria && activeTest.rejectionCriteria.length > 0 && (
          <CalloutCard
            variant="danger"
            title="Rejection Criteria"
            items={activeTest.rejectionCriteria}
          />
        )}

        {activeTest.minimumVolume && (
          <div className="flex items-center gap-2 text-xs text-fg-subtle">
            <span className="font-normal">Minimum Volume:</span>
            <span>{activeTest.minimumVolume} mL</span>
          </div>
        )}
      </div>
    </SectionContainer>
  );
};
