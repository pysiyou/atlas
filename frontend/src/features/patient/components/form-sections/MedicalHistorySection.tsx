import React from 'react';
import { Textarea, TagInput } from '@/shared/ui';
import type { PatientFormSectionProps } from './types';

export const MedicalHistorySection: React.FC<
  Pick<PatientFormSectionProps, 'formData' | 'onFieldChange'>
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
            className="w-4 h-4 text-brand border-stroke-strong rounded focus:ring-brand"
          />
          <label htmlFor="smoking" className="text-xs font-medium text-fg-subtle">
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
            className="w-4 h-4 text-brand border-stroke-strong rounded focus:ring-brand"
          />
          <label htmlFor="alcohol" className="text-xs font-medium text-fg-subtle">
            Alcohol Use
          </label>
        </div>
      </div>
    </div>
  );
};
