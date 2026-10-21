import React from 'react';
import { useController } from 'react-hook-form';
import { Textarea, TagInput } from '@/components/inputs';
import { Checkbox } from '@/components/primitives';
import type { PatientFormSectionProps } from '../patientFormTypes';

function normalizeTagList(value: string[] | string | null | undefined): string[] {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    return value
      .split(';')
      .map(s => s.trim())
      .filter(Boolean);
  }
  return [];
}

function familyHistoryDisplay(value: string[] | string | null | undefined): string {
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.join('; ');
  }
  return '';
}

export const MedicalHistorySection: React.FC<PatientFormSectionProps> = ({ control }) => {
  const { field: chronicConditions } = useController({
    control,
    name: 'medicalHistory.chronicConditions',
  });
  const { field: currentMedications } = useController({
    control,
    name: 'medicalHistory.currentMedications',
  });
  const { field: allergies } = useController({
    control,
    name: 'medicalHistory.allergies',
  });
  const { field: previousSurgeries } = useController({
    control,
    name: 'medicalHistory.previousSurgeries',
  });
  const { field: familyHistory } = useController({
    control,
    name: 'medicalHistory.familyHistory',
  });
  const { field: smoking } = useController({
    control,
    name: 'medicalHistory.lifestyle.smoking',
  });
  const { field: alcohol } = useController({
    control,
    name: 'medicalHistory.lifestyle.alcohol',
  });

  return (
    <div className="space-y-space-6">
      <TagInput
        label="Chronic Conditions"
        tags={normalizeTagList(chronicConditions.value)}
        onChange={chronicConditions.onChange}
        placeholder="Type condition and press Enter"
        helperText="Enter chronic medical conditions"
      />
      <TagInput
        label="Current Medications"
        tags={normalizeTagList(currentMedications.value)}
        onChange={currentMedications.onChange}
        placeholder="Type medication and press Enter"
        helperText="Include dosage if known"
      />
      <TagInput
        label="Known Allergies"
        tags={normalizeTagList(allergies.value)}
        onChange={allergies.onChange}
        placeholder="Type allergy and press Enter"
        helperText="Include drug and non-drug allergies"
      />
      <TagInput
        label="Previous Surgeries"
        tags={normalizeTagList(previousSurgeries.value)}
        onChange={previousSurgeries.onChange}
        placeholder="Type surgery and press Enter"
      />
      <Textarea
        label="Family Medical History"
        name="familyHistory"
        value={familyHistoryDisplay(familyHistory.value)}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
          familyHistory.onChange(e.target.value)
        }
        placeholder="Notable family medical history"
        rows={3}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-layout-section pt-space-2">
        <Checkbox
          id="smoking"
          name="smoking"
          checked={smoking.value ?? false}
          onChange={smoking.onChange}
          label="Smoking"
        />
        <Checkbox
          id="alcohol"
          name="alcohol"
          checked={alcohol.value ?? false}
          onChange={alcohol.onChange}
          label="Alcohol Use"
        />
      </div>
    </div>
  );
};
