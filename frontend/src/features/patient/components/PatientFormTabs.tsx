/**
 * Patient Form Tab Content Component
 * Renders different sections of the patient form based on active tab
 */

import React from 'react';
import type { Patient } from '@/types';
import type { PatientFormData } from '../usePatientForm';
import {
  DemographicsSection,
  AddressSection,
  EmergencyContactSection,
  AffiliationSection,
  MedicalHistorySection,
} from '../PatientForm';
import { VitalsSection } from '../VitalsSection';

export interface PatientFormTabsProps {
  activeTab: string;
  formData: PatientFormData;
  errors: Record<string, string>;
  onFieldChange: (field: string, value: string | boolean | number) => void;
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
        <div className="space-y-6">
          <div>
            <div className="text-xs font-medium text-slate-500">General</div>
            <div className="text-sm font-semibold text-slate-900">Identity & contact</div>
          </div>
          <DemographicsSection formData={formData} errors={errors} onFieldChange={onFieldChange} />
          <AddressSection formData={formData} errors={errors} onFieldChange={onFieldChange} />
        </div>
      );

    case 'medical':
      return (
        <div className="space-y-4">
          <div>
            <div className="text-xs font-medium text-slate-500">Medical Background</div>
            <div className="text-sm font-semibold text-slate-900">History, conditions, lifestyle</div>
          </div>
          <MedicalHistorySection formData={formData} onFieldChange={onFieldChange} />
        </div>
      );

    case 'vitals':
      return (
        <div className="space-y-4">
          <div>
            <div className="text-xs font-medium text-slate-500">Vitals</div>
            <div className="text-sm font-semibold text-slate-900">Measurements</div>
            <div className="text-xs text-slate-500 mt-1">
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
          <div>
            <div className="text-xs font-medium text-slate-500">Affiliation</div>
            <div className="text-sm font-semibold text-slate-900">Auto-generated assurance</div>
          </div>
          <AffiliationSection
            formData={formData}
            onFieldChange={onFieldChange}
            existingAffiliation={existingAffiliation}
            onRenew={onRenew}
          />

          <div>
            <div className="text-xs font-medium text-slate-500">Emergency Contact</div>
            <div className="text-sm font-semibold text-slate-900">Primary contact</div>
          </div>
          <EmergencyContactSection
            formData={formData}
            errors={errors}
            onFieldChange={onFieldChange}
          />
        </div>
      );

    default:
      return null;
  }
};
