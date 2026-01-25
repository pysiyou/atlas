/**
 * CollectionRequirementsSection - Collection requirements with tabs for each test
 */

import React from 'react';
import { semanticColors, brandColors } from '@/shared/design-system/tokens/colors';
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
                  ? `${brandColors.primary.backgroundLight.replace('bg-sky-50', 'bg-sky-100')} ${brandColors.primary.textLight.replace('text-sky-800', 'text-sky-700')} font-medium`
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
          <div className={`flex items-start gap-2 p-2 ${semanticColors.warning.backgroundLight} border ${semanticColors.warning.border} rounded`}>
            <span className={`w-1.5 h-1.5 rounded-full ${semanticColors.warning.background} mt-1.5 shrink-0`} />
            <div className="flex-1">
              <div className={`text-xs font-medium ${semanticColors.warning.textLight}`}>Fasting Required</div>
              <div className={`text-xs ${semanticColors.warning.textLight} mt-0.5`}>
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
          <div className={`flex items-start gap-2 p-2 ${semanticColors.danger.backgroundLight} ${semanticColors.danger.border} rounded`}>
            <Icon name={ICONS.actions.alertCircle} className={`w-4 h-4 ${semanticColors.danger.icon} mt-0.5 shrink-0`} />
            <div className="flex-1">
              <div className={`text-xs font-medium ${semanticColors.danger.textOnLight} mb-1`}>Rejection Criteria</div>
              <ul className="list-disc list-inside space-y-0.5">
                {activeTest.rejectionCriteria.map((criteria, idx) => (
                  <li key={idx} className={`text-xs ${semanticColors.danger.textLight}`}>
                    {criteria}
                  </li>
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
    </SectionContainer>
  );
};
