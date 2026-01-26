/**
 * CollectionRequirementsSection - Collection requirements with tabs for each test
 */

import React from 'react';
import { Icon, SectionContainer } from '@/shared/ui';
import { ICONS } from '@/utils/icon-mappings';

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
          {testDetails.map(test => (
            <button
              key={test.code}
              onClick={() => setActiveTestCode(test.code)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                activeTestCode === test.code
                  ? 'bg-sky-100 text-sky-700 font-medium'
                  : 'bg-neutral-100 text-text-tertiary hover:bg-neutral-200'
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
          <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
            <div className="flex-1">
              <div className="text-xs font-medium text-amber-700">Fasting Required</div>
              <div className="text-xs text-amber-700 mt-0.5">
                Patient must fast before sample collection. Verify fasting status before proceeding.
              </div>
            </div>
          </div>
        )}

        {activeTest.containerDescription && (
          <div className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 mt-1.5 shrink-0" />
            <div className="flex-1">
              <div className="text-xs font-medium text-text-secondary mb-1">Container Specifications</div>
              <div className="text-xs text-text-tertiary">{activeTest.containerDescription}</div>
            </div>
          </div>
        )}

        {activeTest.collectionNotes && (
          <div className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 mt-1.5 shrink-0" />
            <div className="flex-1">
              <div className="text-xs font-medium text-text-secondary mb-1">Collection Instructions</div>
              <div className="text-xs text-text-tertiary">{activeTest.collectionNotes}</div>
            </div>
          </div>
        )}

        {activeTest.rejectionCriteria && activeTest.rejectionCriteria.length > 0 && (
          <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded">
            <Icon name={ICONS.actions.alertCircle} className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="text-xs font-medium text-red-700 mb-1">Rejection Criteria</div>
              <ul className="list-disc list-inside space-y-0.5">
                {activeTest.rejectionCriteria.map((criteria, idx) => (
                  <li key={idx} className="text-xs text-red-700">
                    {criteria}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTest.minimumVolume && (
          <div className="flex items-center gap-2 text-xs text-text-tertiary">
            <span className="font-medium">Minimum Volume:</span>
            <span>{activeTest.minimumVolume} mL</span>
          </div>
        )}
      </div>
    </SectionContainer>
  );
};
