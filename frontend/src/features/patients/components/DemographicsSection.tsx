import React, { useMemo } from 'react';
import { useController } from 'react-hook-form';
import { Input, DateInput } from '@/components/inputs';
import { MultiSelectFilter } from '@/components/overlays';
import type { FilterOption } from '@/components/overlays';
import { GENDER_VALUES, GENDER_CONFIG, type Gender } from '@/types';
import { createFilterOptions } from '@/utils/filtering';
import { ICONS } from '@/config/icons';
import { FORM_FIELD_LABEL } from '@/theme/recipes';
import { FIELD_ERROR, TONE } from '@/theme/recipes';
import type { PatientFormSectionProps } from '../patientFormTypes';
import { patientFieldError } from '../patientFormFieldError';

export const DemographicsSection: React.FC<PatientFormSectionProps> = ({ control, errors }) => {
  const { field: fullName } = useController({ control, name: 'fullName' });
  const { field: dateOfBirth } = useController({ control, name: 'dateOfBirth' });
  const { field: gender } = useController({ control, name: 'gender' });
  const { field: phone } = useController({ control, name: 'phone' });
  const { field: email } = useController({ control, name: 'email' });
  const { field: height } = useController({ control, name: 'height' });
  const { field: weight } = useController({ control, name: 'weight' });

  const genderOptions: FilterOption[] = useMemo(
    () => createFilterOptions(GENDER_VALUES, GENDER_CONFIG),
    [],
  );

  const selectedGender = useMemo(() => (gender.value ? [gender.value] : []), [gender.value]);

  const handleGenderChange = (selectedIds: string[]) => {
    if (selectedIds.length === 0) {
      gender.onChange(undefined);
      return;
    }
    const lastId = selectedIds[selectedIds.length - 1];
    if (lastId === 'male' || lastId === 'female') {
      gender.onChange(lastId as Gender);
    }
  };

  return (
    <div className="space-y-space-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-layout-section">
        <div className="md:col-span-2">
          <Input
            inferIcon
            label="Full Name"
            name="fullName"
            value={fullName.value ?? ''}
            onChange={fullName.onChange}
            error={patientFieldError(errors, 'fullName')}
            required
            placeholder="John Doe"
          />
        </div>
        <DateInput
          label="Date of Birth"
          name="dateOfBirth"
          value={dateOfBirth.value ?? ''}
          onChange={dateOfBirth.onChange}
          error={patientFieldError(errors, 'dateOfBirth')}
          required
          placeholder="Select date of birth"
          maxDate={new Date()}
        />
        <div>
          <label className={`${FORM_FIELD_LABEL} mb-space-1.5`}>
            Gender <span className={`${TONE.danger.fg} ml-space-1`}>*</span>
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
          {patientFieldError(errors, 'gender') && (
            <p className={`mt-space-1 ${FIELD_ERROR}`}>{patientFieldError(errors, 'gender')}</p>
          )}
        </div>
        <Input
          inferIcon
          label="Phone Number"
          name="phone"
          type="tel"
          value={phone.value ?? ''}
          onChange={phone.onChange}
          error={patientFieldError(errors, 'phone')}
          required
          placeholder="(555) 123-4567"
        />
        <Input
          inferIcon
          label="Email Address"
          name="email"
          type="email"
          value={email.value ?? ''}
          onChange={email.onChange}
          error={patientFieldError(errors, 'email')}
          placeholder="patient@email.com"
        />
        <Input
          inferIcon
          label="Height (cm)"
          name="height"
          type="number"
          step="0.1"
          min="30"
          max="250"
          value={height.value != null ? String(height.value) : ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const raw = e.target.value;
            height.onChange(raw ? parseFloat(raw) : undefined);
          }}
          error={patientFieldError(errors, 'height')}
          placeholder="175.5"
        />
        <Input
          inferIcon
          label="Weight (kg)"
          name="weight"
          type="number"
          step="0.1"
          min="1"
          max="500"
          value={weight.value != null ? String(weight.value) : ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const raw = e.target.value;
            weight.onChange(raw ? parseFloat(raw) : undefined);
          }}
          error={patientFieldError(errors, 'weight')}
          placeholder="70.5"
        />
      </div>
    </div>
  );
};
