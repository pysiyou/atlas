import React, { useMemo } from 'react';
import { Input, DateInput, MultiSelectFilter } from '@/shared/ui';
import type { FilterOption } from '@/shared/ui';
import { GENDER_VALUES, GENDER_CONFIG, type Gender } from '@/types';
import { createFilterOptions } from '@/utils/filtering';
import { ICONS } from '@/utils';
import type { PatientFormSectionProps } from './types';

export const DemographicsSection: React.FC<
  Pick<PatientFormSectionProps, 'formData' | 'errors' | 'onFieldChange'>
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
          <label className="block text-xs font-normal text-fg-subtle mb-1.5">
            Gender <span className="text-danger-fg ml-1">*</span>
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
            <p className="mt-1 text-sm text-danger-fg">{errors.gender}</p>
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
