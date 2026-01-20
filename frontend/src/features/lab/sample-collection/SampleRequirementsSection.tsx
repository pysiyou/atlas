/**
 * SampleRequirementsSection - Collection requirements with tabs for each test
 */

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { DetailSection } from '../shared/LabDetailModal';

/** Test detail for requirements display */
export interface TestDetail {
  code: string;
  fastingRequired?: boolean;
  containerDescription?: string;
  collectionNotes?: string;
  rejectionCriteria?: string[];
  minimumVolume?: number;
}

interface SampleRequirementsSectionProps {
  testDetails: TestDetail[];
}

/**
 * Requirements section with tabs for each test
 * Displays collection requirements, fasting info, and rejection criteria
 */
export const SampleRequirementsSection: React.FC<SampleRequirementsSectionProps> = ({ testDetails }) => {
  const [activeTestCode, setActiveTestCode] = React.useState(testDetails[0]?.code || '');
  const activeTest = testDetails.find(t => t.code === activeTestCode) || testDetails[0];

  if (!activeTest) return null;

  return (
    <DetailSection
      title="Collection Requirements & Instructions"
      headerRight={
        <div className="flex gap-1">
          {testDetails.map(test => (
            <button
              key={test.code}
              onClick={() => setActiveTestCode(test.code)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                activeTestCode === test.code
                  ? 'bg-blue-100 text-blue-700 font-medium'
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
          <div className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded">
            <AlertCircle size={16} className="text-red-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="text-xs font-medium text-red-900 mb-1">Rejection Criteria</div>
              <ul className="list-disc list-inside space-y-0.5">
                {activeTest.rejectionCriteria.map((criteria, idx) => (
                  <li key={idx} className="text-xs text-red-700">{criteria}</li>
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
    </DetailSection>
  );
};
