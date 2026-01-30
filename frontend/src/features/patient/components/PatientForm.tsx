/**
 * PatientFormSections Component
 * Consolidated form sections for patient registration and editing
 * Includes: Demographics, Address, Affiliation, Emergency Contact, and Medical History
 *
 * Note: This file exceeds max-lines due to multiple form sections (Demographics, Address,
 * Affiliation, Emergency Contact, Medical History). Each section is self-contained and
 * properly organized. Breaking into separate files would reduce cohesion.
 */
/* eslint-disable max-lines */

import React, { useMemo } from 'react';
import {
  Input,
  Textarea,
  Badge,
  Button,
  TagInput,
  DateInput,
  MultiSelectFilter,
} from '@/shared/ui';
import type { Gender, AffiliationDuration, Affiliation, Relationship } from '@/types';
import { AFFILIATION_DURATION_OPTIONS, GENDER_VALUES, GENDER_CONFIG, RELATIONSHIP_VALUES, RELATIONSHIP_CONFIG } from '@/types';
import { formatDate } from '@/utils';
import { usePatientService } from '../services/usePatientService';
import type { FilterOption } from '@/shared/ui';
import { AffiliationPlanSelector } from './AffiliationPlanSelector';
import { createFilterOptions } from '@/utils/filtering';
import { ICONS } from '@/utils';

/**
 * Props for PatientFormSections component
 */
interface PatientFormSectionsProps {
  formData: {
    fullName: string;
    dateOfBirth: string;
    gender?: Gender;
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
> = ({ formData, errors, onFieldChange }) => {
  // Convert gender options to FilterOption format
  const genderOptions: FilterOption[] = useMemo(
    () => createFilterOptions(GENDER_VALUES, GENDER_CONFIG),
    []
  );

  // Convert single value to array for MultiSelectFilter (single-select mode)
  const selectedGender = useMemo(
    () => (formData.gender ? [formData.gender] : []),
    [formData.gender]
  );

  // Handle gender change (single-select: only allow one selection)
  const handleGenderChange = (selectedIds: string[]) => {
    if (selectedIds.length === 0) {
      // Clear button clicked: actually clear the selection (show placeholder)
      onFieldChange('gender', undefined);
    } else {
      // Use the most recently selected item (last in array)
      // Type guard to ensure valid Gender value
      const lastId = selectedIds[selectedIds.length - 1];
      const validGenders: Gender[] = ['male', 'female'];
      if (validGenders.includes(lastId as Gender)) {
        onFieldChange('gender', lastId as Gender);
      }
    }
  };

  return (
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
        <div>
          <label className="block text-xs font-medium text-text-tertiary mb-1.5">
            Gender <span className="text-feedback-danger-text ml-1">*</span>
          </label>
          <MultiSelectFilter
            label="Gender"
            options={genderOptions}
            selectedIds={selectedGender}
            onChange={handleGenderChange}
            placeholder="Select gender"
            showSelectAll={false}
            singleSelect={true}
            icon={ICONS.dataFields.userHands}
            className="w-full"
          />
          {errors.gender && (
            <p className="mt-1 text-sm text-feedback-danger-text">{errors.gender}</p>
          )}
        </div>
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
};

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
  Pick<
    PatientFormSectionsProps,
    'formData' | 'errors' | 'onFieldChange' | 'existingAffiliation' | 'onRenew'
  >
> = ({ formData, errors, onFieldChange, existingAffiliation, onRenew }) => {
  const { isAffiliationActive } = usePatientService();
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
        <div className="bg-surface-default border border-border-default rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
            <span className="text-sm font-semibold text-text-primary">Current Affiliation</span>
            <Badge variant={isActive ? 'success' : 'danger'} size="sm" className="font-medium">
              {isActive ? 'Active' : 'Expired'}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                Assurance Number
              </span>
              <p className="font-mono font-semibold text-text-primary text-sm">
                {existingAffiliation.assuranceNumber}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                Duration
              </span>
              <p className="font-semibold text-text-primary text-sm">
                {AFFILIATION_DURATION_OPTIONS.find(
                  opt => opt.value === existingAffiliation.duration
                )?.label || `${existingAffiliation.duration} Months`}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                Start Date
              </span>
              <p className="font-semibold text-text-primary text-sm">
                {formatDate(existingAffiliation.startDate)}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
                Expiry Date
              </span>
              <p className={`font-semibold text-sm ${isActive ? 'text-text-primary' : 'text-feedback-danger-text'}`}>
                {formatDate(existingAffiliation.endDate)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* New/Renewal Affiliation Toggle */}
      {!hasExistingAffiliation && (
        <div className="flex items-center gap-3 p-4 bg-surface-canvas rounded-lg border border-border-default">
          <input
            type="checkbox"
            id="hasAffiliation"
            name="hasAffiliation"
            checked={formData.hasAffiliation}
            onChange={e => {
              onFieldChange('hasAffiliation', e.target.checked);
              if (!e.target.checked) {
                onFieldChange('affiliationDuration', undefined);
              }
            }}
            className="w-4 h-4 text-action-primary border-border-strong rounded focus:ring-action-primary focus:ring-2"
          />
          <label
            htmlFor="hasAffiliation"
            className="text-sm font-medium text-text-secondary cursor-pointer"
          >
            Subscribe to lab affiliation
          </label>
        </div>
      )}

      {/* Plan Selector - Show when user wants affiliation (new or extending) */}
      {(formData.hasAffiliation || (hasExistingAffiliation && !isActive)) && (
        <div>
          {errors?.affiliationDuration && (
            <p className="mb-2 text-sm text-feedback-danger-text">{errors.affiliationDuration}</p>
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
        <Button type="button" onClick={onRenew} variant="primary" size="md" fullWidth>
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
  // Convert relationship options to FilterOption format with badge variants
  // Use relationship values directly as Badge variants (defined in Badge component)
  const relationshipOptions: FilterOption[] = useMemo(
    () =>
      RELATIONSHIP_VALUES.map(value => ({
        id: value,
        label: RELATIONSHIP_CONFIG[value].label,
        color: value, // Use relationship value as Badge variant
      })),
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
      onFieldChange('emergencyContactRelationship', undefined);
    } else {
      // Use the most recently selected item (last in array)
      // Type guard to ensure valid Relationship value
      const lastId = selectedIds[selectedIds.length - 1];
      if (RELATIONSHIP_VALUES.includes(lastId as Relationship)) {
        onFieldChange('emergencyContactRelationship', lastId as Relationship);
      }
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
          <label className="block text-xs font-medium text-text-tertiary mb-1.5">
            Relationship <span className="text-feedback-danger-text ml-1">*</span>
          </label>
          <MultiSelectFilter
            label="Relationship"
            options={relationshipOptions}
            selectedIds={selectedRelationship}
            onChange={handleRelationshipChange}
            placeholder="Select relationship"
            showSelectAll={false}
            singleSelect={true}
            icon={ICONS.ui.link}
            className="w-full"
          />
          {errors.emergencyContactRelationship && (
            <p className="mt-1 text-sm text-feedback-danger-text">{errors.emergencyContactRelationship}</p>
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
            className="w-4 h-4 text-action-primary border-border-strong rounded focus:ring-action-primary"
          />
          <label htmlFor="smoking" className="text-xs font-medium text-text-tertiary">
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
            className="w-4 h-4 text-action-primary border-border-strong rounded focus:ring-action-primary"
          />
          <label htmlFor="alcohol" className="text-xs font-medium text-text-tertiary">
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
      <div className="bg-surface-default rounded-lg p-6 shadow-sm border border-border-default">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Patient Demographics</h3>
        <div className="space-y-4">
          <DemographicsSection formData={formData} errors={errors} onFieldChange={onFieldChange} />
        </div>
      </div>
      <div className="bg-surface-default rounded-lg p-6 shadow-sm border border-border-default">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Address Information</h3>
        <div className="space-y-4">
          <AddressSection formData={formData} errors={errors} onFieldChange={onFieldChange} />
        </div>
      </div>
      <div className="bg-surface-default rounded-lg p-6 shadow-sm border border-border-default">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Lab Affiliation</h3>
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
      <div className="bg-surface-default rounded-lg p-6 shadow-sm border border-border-default">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Emergency Contact</h3>
        <div className="space-y-4">
          <EmergencyContactSection
            formData={formData}
            errors={errors}
            onFieldChange={onFieldChange}
          />
        </div>
      </div>
      <div className="bg-surface-default rounded-lg p-6 shadow-sm border border-border-default">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Medical History</h3>
        <div className="space-y-4">
          <MedicalHistorySection formData={formData} onFieldChange={onFieldChange} />
        </div>
      </div>
    </div>
  );
};
