/**
 * Patient Form Tab Content Component
 * Renders different sections of the patient form based on active tab
 */

import React from 'react';
import type { Patient } from '@/types';
// PatientFormData type - temporary during migration
type PatientFormData = {
  fullName: string;
  dateOfBirth: string;
  gender?: 'male' | 'female';
  phone: string;
  email: string;
  height: string;
  weight: string;
  street: string;
  city: string;
  postalCode: string;
  hasAffiliation: boolean;
  affiliationDuration?: 6 | 12 | 24;
  emergencyContactFullName: string;
  emergencyContactRelationship?: 'spouse' | 'parent' | 'sibling' | 'child' | 'friend' | 'other';
  emergencyContactPhone: string;
  emergencyContactEmail: string;
  chronicConditions: string;
  currentMedications: string;
  allergies: string;
  previousSurgeries: string;
  familyHistory: string;
  smoking: boolean;
  alcohol: boolean;
  temperature: string;
  heartRate: string;
  systolicBP: string;
  diastolicBP: string;
  respiratoryRate: string;
  oxygenSaturation: string;
};
import {
  DemographicsSection,
  AddressSection,
  EmergencyContactSection,
  AffiliationSection,
  MedicalHistorySection,
} from '../../forms/PatientForm';
import { VitalsSection } from '../../forms/VitalsSection';

export interface PatientFormTabsProps {
  activeTab: string;
  formData: PatientFormData;
  errors: Record<string, string>;
  onFieldChange: (field: string, value: string | boolean | number | undefined) => void;
  existingAffiliation?: Patient['affiliation'];
  onRenew?: () => void;
}

/**
 * Renders the content for the currently active tab
 */
export const PatientFormTabs: React.FC<PatientFormTabsProps> = ({
  activeTab,
  formData,
  errors,
  onFieldChange,
  existingAffiliation,
  onRenew,
}) => {
  switch (activeTab) {
    case 'general':
      return (
        <div className="space-y-8">
          <div className="space-y-6">
            <div className="pb-1">
              <div className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1">
                General
              </div>
              <div className="text-base font-semibold text-text-primary">Identity & Contact</div>
            </div>
            <DemographicsSection formData={formData} errors={errors} onFieldChange={onFieldChange} />
            <AddressSection formData={formData} errors={errors} onFieldChange={onFieldChange} />
          </div>

          <div className="border-t border-border pt-6 space-y-6">
            <div className="pb-1">
              <div className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1">
                Primary Contact
              </div>
              <div className="text-base font-semibold text-text-primary">Emergency Contact</div>
            </div>
            <EmergencyContactSection
              formData={formData}
              errors={errors}
              onFieldChange={onFieldChange}
            />
          </div>
        </div>
      );

    case 'medical':
      return (
        <div className="space-y-6">
          <div className="pb-1">
            <div className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1">
              Medical Background
            </div>
            <div className="text-base font-semibold text-text-primary">
              History, Conditions & Lifestyle
            </div>
          </div>
          <MedicalHistorySection formData={formData} onFieldChange={onFieldChange} />
        </div>
      );

    case 'vitals':
      return (
        <div className="space-y-6">
          <div className="pb-1">
            <div className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1">
              Vitals
            </div>
            <div className="text-base font-semibold text-text-primary">Measurements</div>
            <div className="text-xs text-text-tertiary mt-1.5 leading-relaxed">
              Fill all vitals or leave all blank. Hints show typical ranges.
            </div>
          </div>
          <VitalsSection
            vitalSigns={{
              temperature: formData.temperature,
              heartRate: formData.heartRate,
              systolicBP: formData.systolicBP,
              diastolicBP: formData.diastolicBP,
              respiratoryRate: formData.respiratoryRate,
              oxygenSaturation: formData.oxygenSaturation,
            }}
            errors={errors}
            onFieldChange={onFieldChange}
          />
        </div>
      );

    case 'affiliation':
      return (
        <div className="space-y-6">
          <div className="pb-1">
            <div className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1">
              Affiliation
            </div>
            <div className="text-base font-semibold text-text-primary">Select Your Plan</div>
            <div className="text-xs text-text-tertiary mt-1.5 leading-relaxed">
              Choose a duration and pricing that works for you
            </div>
          </div>
          <AffiliationSection
            formData={formData}
            errors={errors}
            onFieldChange={onFieldChange}
            existingAffiliation={existingAffiliation}
            onRenew={onRenew}
          />
        </div>
      );

    default:
      return null;
  }
};
