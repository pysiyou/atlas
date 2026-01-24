/**
 * PatientFormSections Component
 * Consolidated form sections for patient registration and editing
 * Includes: Demographics, Address, Affiliation, Emergency Contact, and Medical History
 */

import React, { useMemo } from 'react';
import { Input, Select, Textarea, Badge, Button, TagInput, DateInput, MultiSelectFilter } from '@/shared/ui';
import type { Gender, AffiliationDuration, Affiliation, Relationship } from '@/types';
import { GENDER_OPTIONS, AFFILIATION_DURATION_OPTIONS, RELATIONSHIP_OPTIONS } from '@/types';
import { formatDate } from '@/utils';
import { isAffiliationActive } from './usePatientForm';
import type { FilterOption } from '@/shared/ui/MultiSelectFilter';
import { AffiliationPlanSelector } from './components/AffiliationPlanSelector';

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
    affiliationDuration?: AffiliationDuration;
    emergencyContactFullName: string;
    emergencyContactRelationship?: Relationship;
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
  onFieldChange: (field: string, value: string | boolean | number | undefined) => void;
  existingAffiliation?: Affiliation;
  onRenew?: () => void;
}

/**
 * Demographics Section
 * Displays patient basic information fields
 */
export const DemographicsSection: React.FC<
  Pick<PatientFormSectionsProps, 'formData' | 'errors' | 'onFieldChange'>
> = ({ formData, errors, onFieldChange }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <Input
          label="Full Name"
          name="fullName"
          value={formData.fullName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onFieldChange('fullName', e.target.value)
          }
          error={errors.fullName}
          required
          placeholder="John Doe"
        />
      </div>
      <DateInput
        label="Date of Birth"
        name="dateOfBirth"
        value={formData.dateOfBirth}
        onChange={(value: string) => onFieldChange('dateOfBirth', value)}
        error={errors.dateOfBirth}
        required
        placeholder="Select date of birth"
        maxDate={new Date()}
      />
      <Select
        label="Gender"
        name="gender"
        value={formData.gender}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
          onFieldChange('gender', e.target.value)
        }
        options={GENDER_OPTIONS}
        required
      />
      <Input
        label="Phone Number"
        name="phone"
        type="tel"
        value={formData.phone}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onFieldChange('phone', e.target.value)
        }
        error={errors.phone}
        required
        placeholder="(555) 123-4567"
      />
      <Input
        label="Email Address"
        name="email"
        type="email"
        value={formData.email}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onFieldChange('email', e.target.value)
        }
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
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onFieldChange('height', e.target.value)
        }
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
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onFieldChange('weight', e.target.value)
        }
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
export const AddressSection: React.FC<
  Pick<PatientFormSectionsProps, 'formData' | 'errors' | 'onFieldChange'>
> = ({ formData, errors, onFieldChange }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <Input
          label="Street Address"
          name="street"
          value={formData.street}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onFieldChange('street', e.target.value)
          }
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
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onFieldChange('postalCode', e.target.value)
        }
        error={errors.postalCode}
        required
        placeholder="12345"
      />
    </div>
  </div>
);

/**
 * Affiliation Section
 * Displays lab affiliation/subscription fields with subscription-style plan selector
 */
export const AffiliationSection: React.FC<
  Pick<PatientFormSectionsProps, 'formData' | 'errors' | 'onFieldChange' | 'existingAffiliation' | 'onRenew'>
> = ({ formData, errors, onFieldChange, existingAffiliation, onRenew }) => {
  const hasExistingAffiliation = !!existingAffiliation;
  const isActive = isAffiliationActive(existingAffiliation);

  // Handle plan selection from AffiliationPlanSelector
  const handlePlanSelect = (duration: AffiliationDuration) => {
    onFieldChange('hasAffiliation', true);
    onFieldChange('affiliationDuration', duration);
  };

  return (
    <div className="space-y-6">
      {/* Existing Affiliation Info */}
      {hasExistingAffiliation && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900">Current Affiliation</span>
            <Badge 
              variant={isActive ? 'success' : 'danger'} 
              size="sm"
              className="font-medium"
            >
              {isActive ? 'Active' : 'Expired'}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Assurance Number</span>
              <p className="font-mono font-semibold text-gray-900 text-sm">
                {existingAffiliation.assuranceNumber}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Duration</span>
              <p className="font-semibold text-gray-900 text-sm">
                {AFFILIATION_DURATION_OPTIONS.find(
                  opt => opt.value === existingAffiliation.duration
                )?.label || `${existingAffiliation.duration} Months`}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Start Date</span>
              <p className="font-semibold text-gray-900 text-sm">
                {formatDate(existingAffiliation.startDate)}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Expiry Date</span>
              <p className={`font-semibold text-sm ${isActive ? 'text-gray-900' : 'text-red-600'}`}>
                {formatDate(existingAffiliation.endDate)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* New/Renewal Affiliation Toggle */}
      {!hasExistingAffiliation && (
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <input
            type="checkbox"
            id="hasAffiliation"
            name="hasAffiliation"
            checked={formData.hasAffiliation}
            onChange={e => {
              onFieldChange('hasAffiliation', e.target.checked);
              if (!e.target.checked) {
                onFieldChange('affiliationDuration', undefined as never);
              }
            }}
            className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
          />
          <label htmlFor="hasAffiliation" className="text-sm font-medium text-gray-700 cursor-pointer">
            Subscribe to lab affiliation
          </label>
        </div>
      )}

      {/* Plan Selector - Show when user wants affiliation (new or extending) */}
      {(formData.hasAffiliation || (hasExistingAffiliation && !isActive)) && (
        <div>
          {errors?.affiliationDuration && (
            <p className="mb-2 text-sm text-red-600">{errors.affiliationDuration}</p>
          )}
          <AffiliationPlanSelector
            selectedDuration={formData.affiliationDuration}
            onDurationSelect={handlePlanSelect}
            hasExistingAffiliation={hasExistingAffiliation}
            isActive={isActive}
            actionLabel={hasExistingAffiliation ? (isActive ? 'Extend' : 'Renew') : 'Continue'}
          />
        </div>
      )}

      {/* Show renew button for expired affiliations if not already showing plan selector */}
      {hasExistingAffiliation && !isActive && !formData.hasAffiliation && onRenew && (
        <Button
          type="button"
          onClick={onRenew}
          variant="primary"
          size="md"
          fullWidth
        >
          Renew Affiliation
        </Button>
      )}
    </div>
  );
};

/**
 * Emergency Contact Section
 * Displays emergency contact fields
 */
export const EmergencyContactSection: React.FC<
  Pick<PatientFormSectionsProps, 'formData' | 'errors' | 'onFieldChange'>
> = ({ formData, errors, onFieldChange }) => {
  // Convert relationship options to FilterOption format with colors
  const relationshipOptions: FilterOption[] = useMemo(
    () =>
      RELATIONSHIP_OPTIONS.map(opt => {
        // Assign colors based on relationship type
        let color: string = 'default';
        if (opt.value === 'spouse') color = 'primary'; // Spouse - sky blue
        else if (opt.value === 'parent') color = 'info'; // Parent - blue
        else if (opt.value === 'sibling') color = 'success'; // Sibling - green
        else if (opt.value === 'child') color = 'warning'; // Child - yellow/orange
        else if (opt.value === 'friend') color = 'purple'; // Friend - purple
        else if (opt.value === 'other') color = 'neutral'; // Other - neutral gray

        return {
          id: opt.value,
          label: opt.label,
          color,
        };
      }),
    []
  );

  // Convert single value to array for MultiSelectFilter (single-select mode)
  const selectedRelationship = useMemo(
    () => (formData.emergencyContactRelationship ? [formData.emergencyContactRelationship] : []),
    [formData.emergencyContactRelationship]
  );

  // Handle relationship change (single-select: only allow one selection)
  const handleRelationshipChange = (selectedIds: string[]) => {
    if (selectedIds.length === 0) {
      // Clear button clicked: actually clear the selection (show placeholder)
      onFieldChange('emergencyContactRelationship', undefined as never);
    } else {
      // Use the most recently selected item (last in array)
      const newValue = selectedIds[selectedIds.length - 1] as Relationship;
      onFieldChange('emergencyContactRelationship', newValue);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Contact Full Name"
          name="emergencyContactFullName"
          value={formData.emergencyContactFullName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onFieldChange('emergencyContactFullName', e.target.value)
          }
          error={errors.emergencyContactFullName}
          required
          placeholder="Jane Doe"
        />
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Relationship <span className="text-red-500">*</span>
          </label>
          <MultiSelectFilter
            label="Relationship"
            options={relationshipOptions}
            selectedIds={selectedRelationship}
            onChange={handleRelationshipChange}
            placeholder="Select relationship"
            showSelectAll={false}
            singleSelect={true}
            className="w-full"
          />
          {errors.emergencyContactRelationship && (
            <p className="mt-1 text-sm text-red-600">{errors.emergencyContactRelationship}</p>
          )}
        </div>
        <Input
          label="Contact Phone"
          name="emergencyContactPhone"
          type="tel"
          value={formData.emergencyContactPhone}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onFieldChange('emergencyContactPhone', e.target.value)
          }
          error={errors.emergencyContactPhone}
          required
          placeholder="(555) 987-6543"
        />
        <Input
          label="Contact Email"
          name="emergencyContactEmail"
          type="email"
          value={formData.emergencyContactEmail}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onFieldChange('emergencyContactEmail', e.target.value)
          }
          error={errors.emergencyContactEmail}
          placeholder="contact@email.com"
        />
      </div>
    </div>
  );
};

/**
 * Medical History Section
 * Displays medical history fields with tag inputs for lists
 */
export const MedicalHistorySection: React.FC<
  Pick<PatientFormSectionsProps, 'formData' | 'onFieldChange'>
> = ({ formData, onFieldChange }) => {
  // Convert semicolon-separated strings to arrays for TagInput
  const chronicConditionsArray = formData.chronicConditions
    ? formData.chronicConditions
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0)
    : [];
  const currentMedicationsArray = formData.currentMedications
    ? formData.currentMedications
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0)
    : [];
  const allergiesArray = formData.allergies
    ? formData.allergies
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0)
    : [];
  const previousSurgeriesArray = formData.previousSurgeries
    ? formData.previousSurgeries
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0)
    : [];

  // Convert arrays back to semicolon-separated strings
  const handleTagsChange = (field: string, tags: string[]) => {
    onFieldChange(field, tags.join('; '));
  };

  return (
    <div className="space-y-6">
      <TagInput
        label="Chronic Conditions"
        tags={chronicConditionsArray}
        onChange={tags => handleTagsChange('chronicConditions', tags)}
        placeholder="Type condition and press Enter"
        helperText="Enter chronic medical conditions"
        tagVariant="outline"
      />
      <TagInput
        label="Current Medications"
        tags={currentMedicationsArray}
        onChange={tags => handleTagsChange('currentMedications', tags)}
        placeholder="Type medication and press Enter"
        helperText="Include dosage if known"
        tagVariant="outline"
      />
      <TagInput
        label="Known Allergies"
        tags={allergiesArray}
        onChange={tags => handleTagsChange('allergies', tags)}
        placeholder="Type allergy and press Enter"
        helperText="Include drug and non-drug allergies"
        tagVariant="outline"
      />
      <TagInput
        label="Previous Surgeries"
        tags={previousSurgeriesArray}
        onChange={tags => handleTagsChange('previousSurgeries', tags)}
        placeholder="Type surgery and press Enter"
        tagVariant="outline"
      />
      <Textarea
        label="Family Medical History"
        name="familyHistory"
        value={formData.familyHistory}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
          onFieldChange('familyHistory', e.target.value)
        }
        placeholder="Notable family medical history"
        rows={3}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="smoking"
            name="smoking"
            checked={formData.smoking}
            onChange={e => onFieldChange('smoking', e.target.checked)}
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
            onChange={e => onFieldChange('alcohol', e.target.checked)}
            className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
          />
          <label htmlFor="alcohol" className="text-xs font-medium text-gray-500">
            Alcohol Use
          </label>
        </div>
      </div>
    </div>
  );
};

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
          errors={errors}
          onFieldChange={onFieldChange}
          existingAffiliation={existingAffiliation}
          onRenew={onRenew}
        />
      </div>
      <div className="bg-white rounded p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h3>
        <EmergencyContactSection
          formData={formData}
          errors={errors}
          onFieldChange={onFieldChange}
        />
      </div>
      <div className="bg-white rounded p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Medical History</h3>
        <MedicalHistorySection formData={formData} onFieldChange={onFieldChange} />
      </div>
    </div>
  );
};
