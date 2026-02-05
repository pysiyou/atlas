/**
 * CollectionRequirementsSection - Collection requirements with tabs for each test
 */

import React from 'react';
import { Icon, SectionContainer } from '@/shared/ui';
import { ICONS } from '@/utils';

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
                  ? 'bg-brand-muted text-brand font-medium'
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
          <div className="flex items-start gap-2 p-2 bg-warning-bg border border-warning-border rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-warning-bg0 mt-1.5 shrink-0" />
            <div className="flex-1">
              <div className="text-xs font-medium text-warning-text">Fasting Required</div>
              <div className="text-xs text-warning-text mt-0.5">
                Patient must fast before sample collection. Verify fasting status before proceeding.
              </div>
            </div>
          </div>
        )}

        {activeTest.containerDescription && (
          <div className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 mt-1.5 shrink-0" />
            <div className="flex-1">
              <div className="text-xs font-medium text-fg-subtle mb-1">Container Specifications</div>
              <div className="text-xs text-fg-subtle">{activeTest.containerDescription}</div>
            </div>
          </div>
        )}

        {activeTest.collectionNotes && (
          <div className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 mt-1.5 shrink-0" />
            <div className="flex-1">
              <div className="text-xs font-medium text-fg-subtle mb-1">Collection Instructions</div>
              <div className="text-xs text-fg-subtle">{activeTest.collectionNotes}</div>
            </div>
          </div>
        )}

        {activeTest.rejectionCriteria && activeTest.rejectionCriteria.length > 0 && (
          <div className="flex items-start gap-2 p-2 bg-danger-bg border border-danger-border rounded">
            <Icon name={ICONS.actions.alertCircle} className="w-4 h-4 text-danger-fg mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="text-xs font-medium text-danger-fg-strong mb-1">Rejection Criteria</div>
              <ul className="list-disc list-inside space-y-0.5">
                {activeTest.rejectionCriteria.map((criteria, idx) => (
                  <li key={idx} className="text-xs text-danger-fg-strong">
                    {criteria}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTest.minimumVolume && (
          <div className="flex items-center gap-2 text-xs text-fg-subtle">
            <span className="font-medium">Minimum Volume:</span>
            <span>{activeTest.minimumVolume} mL</span>
          </div>
        )}
      </div>
    </SectionContainer>
  );
};
