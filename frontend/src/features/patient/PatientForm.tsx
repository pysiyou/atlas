/**
 * PatientFormSections Component
 * Consolidated form sections for patient registration and editing
 * Includes: Demographics, Address, Affiliation, Emergency Contact, and Medical History
 */

import React from 'react';
import { Input, Select, Textarea, Badge, Button } from '@/shared/ui';
import type { Gender, AffiliationDuration, Affiliation, Relationship } from '@/types';
import { GENDER_OPTIONS, AFFILIATION_DURATION_OPTIONS, RELATIONSHIP_OPTIONS } from '@/types';
import { formatDate } from '@/utils';
import { isAffiliationActive } from './usePatientForm';

/**
 * Props for PatientFormSections component
 */
interface PatientFormSectionsProps {
  formData: {
    fullName: string;
    dateOfBirth: string;
    gender: Gender;
    phone: string;
    email: string;
    height: string;
    weight: string;
    street: string;
    city: string;
    postalCode: string;
    hasAffiliation: boolean;
    affiliationDuration: AffiliationDuration;
    emergencyContactFullName: string;
    emergencyContactRelationship: Relationship;
    emergencyContactPhone: string;
    emergencyContactEmail: string;
    chronicConditions: string;
    currentMedications: string;
    allergies: string;
    previousSurgeries: string;
    familyHistory: string;
    smoking: boolean;
    alcohol: boolean;
  };
  errors: Record<string, string>;
  onFieldChange: (field: string, value: string | boolean | number) => void;
  existingAffiliation?: Affiliation;
  onRenew?: () => void;
}

/**
 * Demographics Section
 * Displays patient basic information fields
 */
export const DemographicsSection: React.FC<Pick<PatientFormSectionsProps, 'formData' | 'errors' | 'onFieldChange'>> = ({
  formData,
  errors,
  onFieldChange,
}) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <Input
          label="Full Name"
          name="fullName"
          value={formData.fullName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onFieldChange('fullName', e.target.value)}
          error={errors.fullName}
          required
          placeholder="John Doe"
        />
      </div>
      <Input
        label="Date of Birth"
        name="dateOfBirth"
        type="date"
        value={formData.dateOfBirth}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onFieldChange('dateOfBirth', e.target.value)}
        error={errors.dateOfBirth}
        required
      />
      <Select
        label="Gender"
        name="gender"
        value={formData.gender}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onFieldChange('gender', e.target.value)}
        options={GENDER_OPTIONS}
        required
      />
      <Input
        label="Phone Number"
        name="phone"
        type="tel"
        value={formData.phone}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onFieldChange('phone', e.target.value)}
        error={errors.phone}
        required
        placeholder="(555) 123-4567"
      />
      <Input
        label="Email Address"
        name="email"
        type="email"
        value={formData.email}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onFieldChange('email', e.target.value)}
        error={errors.email}
        placeholder="patient@email.com"
      />
      <Input
        label="Height (cm)"
        name="height"
        type="number"
        step="0.1"
        min="30"
        max="250"
        value={formData.height}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onFieldChange('height', e.target.value)}
        error={errors.height}
        placeholder="175.5"
      />
      <Input
        label="Weight (kg)"
        name="weight"
        type="number"
        step="0.1"
        min="1"
        max="500"
        value={formData.weight}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onFieldChange('weight', e.target.value)}
        error={errors.weight}
        placeholder="70.5"
      />
    </div>
  </div>
);

/**
 * Address Section
 * Displays patient address fields
 */
export const AddressSection: React.FC<Pick<PatientFormSectionsProps, 'formData' | 'errors' | 'onFieldChange'>> = ({
  formData,
  errors,
  onFieldChange,
}) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <Input
          label="Street Address"
          name="street"
          value={formData.street}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onFieldChange('street', e.target.value)}
          error={errors.street}
          required
          placeholder="123 Main Street"
        />
      </div>
      <Input
        label="City"
        name="city"
        value={formData.city}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onFieldChange('city', e.target.value)}
        error={errors.city}
        required
        placeholder="Springfield"
      />
      <Input
        label="Postal Code"
        name="postalCode"
        value={formData.postalCode}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onFieldChange('postalCode', e.target.value)}
        error={errors.postalCode}
        required
        placeholder="12345"
      />
    </div>
  </div>
);

/**
 * Affiliation Section
 * Displays lab affiliation/subscription fields
 */
export const AffiliationSection: React.FC<Pick<PatientFormSectionsProps, 'formData' | 'onFieldChange' | 'existingAffiliation' | 'onRenew'>> = ({
  formData,
  onFieldChange,
  existingAffiliation,
  onRenew,
}) => {
  const hasExistingAffiliation = !!existingAffiliation;
  const isActive = isAffiliationActive(existingAffiliation);

  return (
    <div className="space-y-4">
      {/* Existing Affiliation Info */}
      {hasExistingAffiliation && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Current Status</span>
            <Badge
              variant={isActive ? 'success' : 'danger'}
              size="sm"
            >
              {isActive ? 'Active' : 'Expired'}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Assurance Number</span>
              <p className="font-mono font-medium text-gray-900">{existingAffiliation.assuranceNumber}</p>
            </div>
            <div>
              <span className="text-gray-500">Duration</span>
              <p className="font-medium text-gray-900">
                {AFFILIATION_DURATION_OPTIONS.find(opt => opt.value === existingAffiliation.duration)?.label || `${existingAffiliation.duration} Months`}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Start Date</span>
              <p className="font-medium text-gray-900">{formatDate(existingAffiliation.startDate)}</p>
            </div>
            <div>
              <span className="text-gray-500">Expiry Date</span>
              <p className={`font-medium ${isActive ? 'text-gray-900' : 'text-red-600'}`}>
                {formatDate(existingAffiliation.endDate)}
              </p>
            </div>
          </div>
          {!isActive && onRenew && (
            <Button
              type="button"
              onClick={onRenew}
              variant="primary"
              size="md"
              fullWidth
              className="mt-2"
            >
              Renew Affiliation
            </Button>
          )}
        </div>
      )}

      {/* New/Renewal Affiliation Toggle */}
      {!hasExistingAffiliation && (
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="hasAffiliation"
            name="hasAffiliation"
            checked={formData.hasAffiliation}
            onChange={(e) => onFieldChange('hasAffiliation', e.target.checked)}
            className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
          />
          <label htmlFor="hasAffiliation" className="text-xs font-medium text-gray-500">
            Subscribe to lab affiliation
          </label>
        </div>
      )}

      {/* Duration Selection (for new subscriptions) */}
      {formData.hasAffiliation && !hasExistingAffiliation && (
        <div className="grid grid-cols-1 gap-4">
          <Select
            label="Subscription Duration"
            name="affiliationDuration"
            value={String(formData.affiliationDuration)}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onFieldChange('affiliationDuration', Number(e.target.value))}
            options={AFFILIATION_DURATION_OPTIONS.map(opt => ({ value: String(opt.value), label: opt.label }))}
            required
          />
          <p className="text-xs text-gray-500">
            An assurance number will be automatically generated upon registration.
          </p>
        </div>
      )}

      {/* Renewal Duration Selection */}
      {hasExistingAffiliation && formData.hasAffiliation && (
        <div className="border-t pt-4 mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Extend Affiliation</h4>
          <Select
            label="Extension Duration"
            name="affiliationDuration"
            value={String(formData.affiliationDuration)}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onFieldChange('affiliationDuration', Number(e.target.value))}
            options={AFFILIATION_DURATION_OPTIONS.map(opt => ({ value: String(opt.value), label: opt.label }))}
            required
          />
        </div>
      )}
    </div>
  );
};

/**
 * Emergency Contact Section
 * Displays emergency contact fields
 */
export const EmergencyContactSection: React.FC<Pick<PatientFormSectionsProps, 'formData' | 'errors' | 'onFieldChange'>> = ({
  formData,
  errors,
  onFieldChange,
}) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Input
        label="Contact Full Name"
        name="emergencyContactFullName"
        value={formData.emergencyContactFullName}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onFieldChange('emergencyContactFullName', e.target.value)}
        error={errors.emergencyContactFullName}
        required
        placeholder="Jane Doe"
      />
      <Select
        label="Relationship"
        name="emergencyContactRelationship"
        value={formData.emergencyContactRelationship}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onFieldChange('emergencyContactRelationship', e.target.value)}
        options={RELATIONSHIP_OPTIONS}
        error={errors.emergencyContactRelationship}
        required
      />
      <Input
        label="Contact Phone"
        name="emergencyContactPhone"
        type="tel"
        value={formData.emergencyContactPhone}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onFieldChange('emergencyContactPhone', e.target.value)}
        error={errors.emergencyContactPhone}
        required
        placeholder="(555) 987-6543"
      />
      <Input
        label="Contact Email"
        name="emergencyContactEmail"
        type="email"
        value={formData.emergencyContactEmail}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onFieldChange('emergencyContactEmail', e.target.value)}
        error={errors.emergencyContactEmail}
        placeholder="contact@email.com"
      />
    </div>
  </div>
);

/**
 * Medical History Section
 * Displays medical history fields
 */
export const MedicalHistorySection: React.FC<Pick<PatientFormSectionsProps, 'formData' | 'onFieldChange'>> = ({
  formData,
  onFieldChange,
}) => (
  <div className="space-y-4">
    <div className="space-y-4">
      <Textarea
        label="Chronic Conditions"
        name="chronicConditions"
        value={formData.chronicConditions}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onFieldChange('chronicConditions', e.target.value)}
        placeholder="Separate multiple conditions with commas (e.g., Hypertension, Diabetes)"
        helperText="Enter chronic medical conditions"
      />
      <Textarea
        label="Current Medications"
        name="currentMedications"
        value={formData.currentMedications}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onFieldChange('currentMedications', e.target.value)}
        placeholder="Separate multiple medications with commas (e.g., Lisinopril 10mg, Metformin 500mg)"
        helperText="Include dosage if known"
      />
      <Textarea
        label="Known Allergies"
        name="allergies"
        value={formData.allergies}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onFieldChange('allergies', e.target.value)}
        placeholder="Separate multiple allergies with commas (e.g., Penicillin, Latex)"
        helperText="Include drug and non-drug allergies"
      />
      <Textarea
        label="Previous Surgeries"
        name="previousSurgeries"
        value={formData.previousSurgeries}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onFieldChange('previousSurgeries', e.target.value)}
        placeholder="Separate multiple surgeries with commas (e.g., Appendectomy 2015, Knee Surgery 2018)"
      />
      <Textarea
        label="Family Medical History"
        name="familyHistory"
        value={formData.familyHistory}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onFieldChange('familyHistory', e.target.value)}
        placeholder="Notable family medical history"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="smoking"
            name="smoking"
            checked={formData.smoking}
            onChange={(e) => onFieldChange('smoking', e.target.checked)}
            className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
          />
          <label htmlFor="smoking" className="text-xs font-medium text-gray-500">
            Smoking
          </label>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="alcohol"
            name="alcohol"
            checked={formData.alcohol}
            onChange={(e) => onFieldChange('alcohol', e.target.checked)}
            className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
          />
          <label htmlFor="alcohol" className="text-xs font-medium text-gray-500">
            Alcohol Use
          </label>
        </div>
      </div>
    </div>
  </div>
);

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
      <div className="bg-white rounded p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Demographics</h3>
        <DemographicsSection formData={formData} errors={errors} onFieldChange={onFieldChange} />
      </div>
      <div className="bg-white rounded p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h3>
        <AddressSection formData={formData} errors={errors} onFieldChange={onFieldChange} />
      </div>
      <div className="bg-white rounded p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Lab Affiliation</h3>
        <AffiliationSection
          formData={formData}
          onFieldChange={onFieldChange}
          existingAffiliation={existingAffiliation}
          onRenew={onRenew}
        />
      </div>
      <div className="bg-white rounded p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h3>
        <EmergencyContactSection formData={formData} errors={errors} onFieldChange={onFieldChange} />
      </div>
      <div className="bg-white rounded p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Medical History</h3>
        <MedicalHistorySection formData={formData} onFieldChange={onFieldChange} />
      </div>
    </div>
  );
};
