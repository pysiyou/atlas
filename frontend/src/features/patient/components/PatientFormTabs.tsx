/**
 * Patient Form Tabs - Using React Hook Form
 * Bridge component that adapts old form sections to React Hook Form
 */

import React from 'react';
import type { UseFormRegister, Control, FieldErrors } from 'react-hook-form';
import type { PatientFormInput } from '../schemas/patient.schema';
import type { Patient } from '@/types';
import {
  DemographicsSection,
  AddressSection,
  EmergencyContactSection,
  AffiliationSection,
  MedicalHistorySection,
} from './PatientForm';
import { VitalsSection } from './VitalsSection';

export interface PatientFormTabsProps {
  activeTab: string;
  register: UseFormRegister<PatientFormInput>;
  control: Control<PatientFormInput>;
  errors: FieldErrors<PatientFormInput>;
  existingAffiliation?: Patient['affiliation'];
}

/**
 * Adapter to convert React Hook Form structure to flat form data structure
 * This allows us to reuse existing form sections while migrating to React Hook Form
 */
function createFormDataAdapter(
  _register: UseFormRegister<PatientFormInput>,
  _control: Control<PatientFormInput>,
  _errors: FieldErrors<PatientFormInput>
) {
  // This is a temporary adapter - in a full migration, form sections would use React Hook Form directly
  // For now, we create a flat structure that matches the old PatientFormData interface
  return {
    fullName: '',
    dateOfBirth: '',
    gender: undefined,
    phone: '',
    email: '',
    height: '',
    weight: '',
    street: '',
    city: '',
    postalCode: '',
    hasAffiliation: false,
    affiliationDuration: undefined,
    emergencyContactFullName: '',
    emergencyContactRelationship: undefined,
    emergencyContactPhone: '',
    emergencyContactEmail: '',
    chronicConditions: '',
    currentMedications: '',
    allergies: '',
    previousSurgeries: '',
    familyHistory: '',
    smoking: false,
    alcohol: false,
    temperature: '',
    heartRate: '',
    systolicBP: '',
    diastolicBP: '',
    respiratoryRate: '',
    oxygenSaturation: '',
  };
}

function createErrorsAdapter(errors: FieldErrors<PatientFormInput>): Record<string, string> {
  const flatErrors: Record<string, string> = {};
  
  // Flatten nested errors
  if (errors.fullName) flatErrors.fullName = errors.fullName.message || '';
  if (errors.dateOfBirth) flatErrors.dateOfBirth = errors.dateOfBirth.message || '';
  if (errors.gender) flatErrors.gender = errors.gender.message || '';
  if (errors.phone) flatErrors.phone = errors.phone.message || '';
  if (errors.email) flatErrors.email = errors.email.message || '';
  if (errors.height) flatErrors.height = errors.height.message || '';
  if (errors.weight) flatErrors.weight = errors.weight.message || '';
  
  if (errors.address) {
    if (errors.address.street) flatErrors.street = errors.address.street.message || '';
    if (errors.address.city) flatErrors.city = errors.address.city.message || '';
    if (errors.address.postalCode) flatErrors.postalCode = errors.address.postalCode.message || '';
  }
  
  if (errors.emergencyContact) {
    if (errors.emergencyContact.fullName) flatErrors.emergencyContactFullName = errors.emergencyContact.fullName.message || '';
    if (errors.emergencyContact.relationship) flatErrors.emergencyContactRelationship = errors.emergencyContact.relationship.message || '';
    if (errors.emergencyContact.phone) flatErrors.emergencyContactPhone = errors.emergencyContact.phone.message || '';
    if (errors.emergencyContact.email) flatErrors.emergencyContactEmail = errors.emergencyContact.email.message || '';
  }
  
  if (errors.vitalSigns) {
    if (errors.vitalSigns.temperature) flatErrors.temperature = errors.vitalSigns.temperature.message || '';
    if (errors.vitalSigns.heartRate) flatErrors.heartRate = errors.vitalSigns.heartRate.message || '';
    if (errors.vitalSigns.systolicBP) flatErrors.systolicBP = errors.vitalSigns.systolicBP.message || '';
    if (errors.vitalSigns.diastolicBP) flatErrors.diastolicBP = errors.vitalSigns.diastolicBP.message || '';
    if (errors.vitalSigns.respiratoryRate) flatErrors.respiratoryRate = errors.vitalSigns.respiratoryRate.message || '';
    if (errors.vitalSigns.oxygenSaturation) flatErrors.oxygenSaturation = errors.vitalSigns.oxygenSaturation.message || '';
  }
  
  return flatErrors;
}

export const PatientFormTabs: React.FC<PatientFormTabsProps> = ({
  activeTab,
  register,
  control,
  errors,
  existingAffiliation,
}) => {
  // TODO: Full migration - form sections should use React Hook Form directly
  // For now, this is a placeholder that shows the structure
  // The actual form sections need to be migrated to use register() and Controller from react-hook-form
  
  const formData = createFormDataAdapter(register, control, errors);
  const flatErrors = createErrorsAdapter(errors);
  
  // Temporary handler - will be replaced when sections are fully migrated
  const onFieldChange = () => {
    // This will be handled by React Hook Form
  };

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
            <DemographicsSection formData={formData} errors={flatErrors} onFieldChange={onFieldChange} />
            <AddressSection formData={formData} errors={flatErrors} onFieldChange={onFieldChange} />
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
              errors={flatErrors}
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
            errors={flatErrors}
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
            errors={flatErrors}
            onFieldChange={onFieldChange}
            existingAffiliation={existingAffiliation}
            onRenew={() => {}}
          />
        </div>
      );

    default:
      return null;
  }
};
