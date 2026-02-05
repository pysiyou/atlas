/**
 * PatientFormSections Component
 * Consolidated form sections for patient registration and editing
 * Includes: Demographics, Address, Affiliation, Emergency Contact, and Medical History
 */

import React from 'react';
import type { Affiliation } from '@/types';
import { DemographicsSection } from './form-sections/DemographicsSection';
import { AddressSection } from './form-sections/AddressSection';
import { AffiliationSection } from './form-sections/AffiliationSection';
import { EmergencyContactSection } from './form-sections/EmergencyContactSection';
import { MedicalHistorySection } from './form-sections/MedicalHistorySection';
import type { PatientFormData } from './form-sections/types';

export type { PatientFormData };

/**
 * Props for PatientFormSections component
 */
export interface PatientFormSectionsProps {
  formData: PatientFormData;
  errors: Record<string, string>;
  onFieldChange: (field: string, value: string | boolean | number | undefined) => void;
  existingAffiliation?: Affiliation;
  onRenew?: () => void;
}

/**
 * Main PatientFormSections Component
 * Combines all form sections into a single organized component
 * Used for registration forms where sections need card styling
 */
export const PatientFormSections: React.FC<PatientFormSectionsProps> = ({
  formData,
  errors,
  onFieldChange,
  existingAffiliation,
  onRenew,
}) => {
  return (
    <div className="space-y-8">
      <div className="bg-panel rounded-lg p-6 shadow-sm border border-stroke">
        <h3 className="text-lg font-semibold text-fg mb-4">Patient Demographics</h3>
        <div className="space-y-4">
          <DemographicsSection formData={formData} errors={errors} onFieldChange={onFieldChange} />
        </div>
      </div>
      <div className="bg-panel rounded-lg p-6 shadow-sm border border-stroke">
        <h3 className="text-lg font-semibold text-fg mb-4">Address Information</h3>
        <div className="space-y-4">
          <AddressSection formData={formData} errors={errors} onFieldChange={onFieldChange} />
        </div>
      </div>
      <div className="bg-panel rounded-lg p-6 shadow-sm border border-stroke">
        <h3 className="text-lg font-semibold text-fg mb-4">Lab Affiliation</h3>
        <div className="space-y-4">
          <AffiliationSection
            formData={formData}
            errors={errors}
            onFieldChange={onFieldChange}
            existingAffiliation={existingAffiliation}
            onRenew={onRenew}
          />
        </div>
      </div>
      <div className="bg-panel rounded-lg p-6 shadow-sm border border-stroke">
        <h3 className="text-lg font-semibold text-fg mb-4">Emergency Contact</h3>
        <div className="space-y-4">
          <EmergencyContactSection
            formData={formData}
            errors={errors}
            onFieldChange={onFieldChange}
          />
        </div>
      </div>
      <div className="bg-panel rounded-lg p-6 shadow-sm border border-stroke">
        <h3 className="text-lg font-semibold text-fg mb-4">Medical History</h3>
        <div className="space-y-4">
          <MedicalHistorySection formData={formData} onFieldChange={onFieldChange} />
        </div>
      </div>
    </div>
  );
};
