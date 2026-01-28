/**
 * Patient Form Tabs - Using React Hook Form
 * Bridge component that adapts old form sections to React Hook Form
 */

import React, { useState, useMemo } from 'react';
import type { UseFormRegister, Control, FieldErrors, UseFormWatch, UseFormSetValue } from 'react-hook-form';
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
  watch: UseFormWatch<PatientFormInput>;
  setValue: UseFormSetValue<PatientFormInput>;
}

/**
 * Adapter to convert React Hook Form structure to flat form data structure
 * This allows us to reuse existing form sections while migrating to React Hook Form
 */
function createFormDataAdapter(
  watch: UseFormWatch<PatientFormInput>,
  hasAffiliationChecked: boolean
) {
  const formValues = watch();
  
  // Map nested React Hook Form structure to flat structure expected by form sections
  return {
    fullName: formValues.fullName || '',
    dateOfBirth: formValues.dateOfBirth || '',
    gender: formValues.gender,
    phone: formValues.phone || '',
    email: formValues.email || '',
    height: formValues.height?.toString() || '',
    weight: formValues.weight?.toString() || '',
    street: formValues.address?.street || '',
    city: formValues.address?.city || '',
    postalCode: formValues.address?.postalCode || '',
    hasAffiliation: hasAffiliationChecked || !!formValues.affiliation,
    affiliationDuration: formValues.affiliation?.duration,
    emergencyContactFullName: formValues.emergencyContact?.fullName || '',
    emergencyContactRelationship: formValues.emergencyContact?.relationship,
    emergencyContactPhone: formValues.emergencyContact?.phone || '',
    emergencyContactEmail: formValues.emergencyContact?.email || '',
    chronicConditions: Array.isArray(formValues.medicalHistory?.chronicConditions) 
      ? formValues.medicalHistory.chronicConditions.join('; ') 
      : formValues.medicalHistory?.chronicConditions || '',
    currentMedications: Array.isArray(formValues.medicalHistory?.currentMedications)
      ? formValues.medicalHistory.currentMedications.join('; ')
      : formValues.medicalHistory?.currentMedications || '',
    allergies: Array.isArray(formValues.medicalHistory?.allergies)
      ? formValues.medicalHistory.allergies.join('; ')
      : formValues.medicalHistory?.allergies || '',
    previousSurgeries: Array.isArray(formValues.medicalHistory?.previousSurgeries)
      ? formValues.medicalHistory.previousSurgeries.join('; ')
      : formValues.medicalHistory?.previousSurgeries || '',
    familyHistory: typeof formValues.medicalHistory?.familyHistory === 'string'
      ? formValues.medicalHistory.familyHistory
      : Array.isArray(formValues.medicalHistory?.familyHistory)
        ? formValues.medicalHistory.familyHistory.join('; ')
        : '',
    smoking: formValues.medicalHistory?.lifestyle?.smoking ?? false,
    alcohol: formValues.medicalHistory?.lifestyle?.alcohol ?? false,
    temperature: formValues.vitalSigns?.temperature?.toString() || '',
    heartRate: formValues.vitalSigns?.heartRate?.toString() || '',
    systolicBP: formValues.vitalSigns?.systolicBP?.toString() || '',
    diastolicBP: formValues.vitalSigns?.diastolicBP?.toString() || '',
    respiratoryRate: formValues.vitalSigns?.respiratoryRate?.toString() || '',
    oxygenSaturation: formValues.vitalSigns?.oxygenSaturation?.toString() || '',
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
  watch,
  setValue,
}) => {
  // Track checkbox state separately since hasAffiliation is derived from affiliation object
  // Initialize from existing affiliation
  const formValues = watch();
  const initialHasAffiliation = useMemo(() => !!existingAffiliation, [existingAffiliation]);
  const [hasAffiliationChecked, setHasAffiliationChecked] = useState(initialHasAffiliation);
  
  // Use checkbox state OR affiliation object presence to determine hasAffiliation
  const effectiveHasAffiliation = hasAffiliationChecked || !!formValues.affiliation;
  
  const formData = createFormDataAdapter(watch, effectiveHasAffiliation);
  const flatErrors = createErrorsAdapter(errors);
  
  // Handler that maps flat field names to nested React Hook Form structure
  const onFieldChange = (field: string, value: unknown) => {
    // Map flat field names to nested React Hook Form paths
    const fieldMap: Record<string, (val: unknown) => void> = {
      fullName: (val) => setValue('fullName', val as string),
      dateOfBirth: (val) => setValue('dateOfBirth', val as string),
      gender: (val) => setValue('gender', val as 'male' | 'female' | undefined),
      phone: (val) => setValue('phone', val as string),
      email: (val) => setValue('email', val as string),
      height: (val) => setValue('height', val ? parseFloat(val as string) : undefined, { shouldValidate: true }),
      weight: (val) => setValue('weight', val ? parseFloat(val as string) : undefined, { shouldValidate: true }),
      street: (val) => {
        const currentAddress = watch('address') || { street: '', city: '', postalCode: '' };
        setValue('address', { ...currentAddress, street: val as string }, { shouldValidate: true });
      },
      city: (val) => {
        const currentAddress = watch('address') || { street: '', city: '', postalCode: '' };
        setValue('address', { ...currentAddress, city: val as string }, { shouldValidate: true });
      },
      postalCode: (val) => {
        const currentAddress = watch('address') || { street: '', city: '', postalCode: '' };
        setValue('address', { ...currentAddress, postalCode: val as string }, { shouldValidate: true });
      },
      hasAffiliation: (val) => {
        setHasAffiliationChecked(val as boolean);
        if (!val) {
          setValue('affiliation', undefined);
        }
      },
      affiliationDuration: (val) => {
        const currentAffiliation = watch('affiliation');
        setValue('affiliation', { ...currentAffiliation, duration: val } as PatientFormInput['affiliation'], { shouldValidate: true });
        // Ensure checkbox is checked when duration is selected
        if (val && !hasAffiliationChecked) {
          setHasAffiliationChecked(true);
        }
      },
      emergencyContactFullName: (val) => {
        const currentContact = watch('emergencyContact') || { fullName: '', relationship: 'other' as const, phone: '', email: '' };
        setValue('emergencyContact', { ...currentContact, fullName: val as string }, { shouldValidate: true });
      },
      emergencyContactRelationship: (val) => {
        const currentContact = watch('emergencyContact') || { fullName: '', relationship: 'other' as const, phone: '', email: '' };
        setValue('emergencyContact', { ...currentContact, relationship: val as PatientFormInput['emergencyContact']['relationship'] }, { shouldValidate: true });
      },
      emergencyContactPhone: (val) => {
        const currentContact = watch('emergencyContact') || { fullName: '', relationship: 'other' as const, phone: '', email: '' };
        setValue('emergencyContact', { ...currentContact, phone: val as string }, { shouldValidate: true });
      },
      emergencyContactEmail: (val) => {
        const currentContact = watch('emergencyContact') || { fullName: '', relationship: 'other' as const, phone: '', email: '' };
        setValue('emergencyContact', { ...currentContact, email: val as string }, { shouldValidate: true });
      },
      chronicConditions: (val) => {
        const conditions = typeof val === 'string' ? val.split(';').map(s => s.trim()).filter(Boolean) : [];
        setValue('medicalHistory.chronicConditions', conditions.length > 0 ? conditions : undefined, { shouldValidate: true });
      },
      currentMedications: (val) => {
        const medications = typeof val === 'string' ? val.split(';').map(s => s.trim()).filter(Boolean) : [];
        setValue('medicalHistory.currentMedications', medications.length > 0 ? medications : undefined, { shouldValidate: true });
      },
      allergies: (val) => {
        const allergies = typeof val === 'string' ? val.split(';').map(s => s.trim()).filter(Boolean) : [];
        setValue('medicalHistory.allergies', allergies.length > 0 ? allergies : undefined, { shouldValidate: true });
      },
      previousSurgeries: (val) => {
        const surgeries = typeof val === 'string' ? val.split(';').map(s => s.trim()).filter(Boolean) : [];
        setValue('medicalHistory.previousSurgeries', surgeries.length > 0 ? surgeries : undefined, { shouldValidate: true });
      },
      familyHistory: (val) => setValue('medicalHistory.familyHistory', val as string || undefined, { shouldValidate: true }),
      smoking: (val) => {
        const currentLifestyle = watch('medicalHistory.lifestyle') || { smoking: false, alcohol: false };
        setValue('medicalHistory.lifestyle', { ...currentLifestyle, smoking: val as boolean }, { shouldValidate: true });
      },
      alcohol: (val) => {
        const currentLifestyle = watch('medicalHistory.lifestyle') || { smoking: false, alcohol: false };
        setValue('medicalHistory.lifestyle', { ...currentLifestyle, alcohol: val as boolean }, { shouldValidate: true });
      },
      temperature: (val) => setValue('vitalSigns.temperature', val ? parseFloat(val as string) : undefined, { shouldValidate: true }),
      heartRate: (val) => setValue('vitalSigns.heartRate', val ? parseInt(val as string, 10) : undefined, { shouldValidate: true }),
      systolicBP: (val) => setValue('vitalSigns.systolicBP', val ? parseInt(val as string, 10) : undefined, { shouldValidate: true }),
      diastolicBP: (val) => setValue('vitalSigns.diastolicBP', val ? parseInt(val as string, 10) : undefined, { shouldValidate: true }),
      respiratoryRate: (val) => setValue('vitalSigns.respiratoryRate', val ? parseInt(val as string, 10) : undefined, { shouldValidate: true }),
      oxygenSaturation: (val) => setValue('vitalSigns.oxygenSaturation', val ? parseFloat(val as string) : undefined, { shouldValidate: true }),
    };

    const handler = fieldMap[field];
    if (handler) {
      handler(value);
    }
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
