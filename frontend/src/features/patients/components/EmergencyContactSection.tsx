import React, { useMemo } from 'react';
import { useController } from 'react-hook-form';
import { Input } from '@/components/inputs';
import { MultiSelectFilter } from '@/components/overlays';
import type { FilterOption } from '@/components/overlays';
import { RELATIONSHIP_VALUES, RELATIONSHIP_CONFIG, type Relationship } from '@/types';
import { ICONS } from '@/config/icons';
import { FORM_FIELD_LABEL } from '@/theme/recipes';
import { FIELD_ERROR, TONE } from '@/theme/recipes';
import { patientFieldError } from '../patientFormFieldError';
import { usePatientFormSection } from '../hooks/usePatientFormSection';

export const EmergencyContactSection: React.FC = () => {
  const { control, errors } = usePatientFormSection();
  const { field: fullName } = useController({ control, name: 'emergencyContact.fullName' });
  const { field: relationship } = useController({ control, name: 'emergencyContact.relationship' });
  const { field: phone } = useController({ control, name: 'emergencyContact.phone' });
  const { field: email } = useController({ control, name: 'emergencyContact.email' });

  const relationshipOptions: FilterOption[] = useMemo(
    () =>
      RELATIONSHIP_VALUES.map(value => ({
        id: value,
        label: RELATIONSHIP_CONFIG[value].label,
        color: value,
      })),
    [],
  );

  const selectedRelationship = useMemo(
    () => (relationship.value ? [relationship.value] : []),
    [relationship.value],
  );

  const handleRelationshipChange = (selectedIds: string[]) => {
    if (selectedIds.length === 0) {
      relationship.onChange(undefined);
      return;
    }
    const lastId = selectedIds[selectedIds.length - 1];
    if (RELATIONSHIP_VALUES.includes(lastId as Relationship)) {
      relationship.onChange(lastId as Relationship);
    }
  };

  return (
    <div className="space-y-space-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-layout-section">
        <Input
          inferIcon
          label="Contact Full Name"
          name="emergencyContactFullName"
          value={fullName.value ?? ''}
          onChange={fullName.onChange}
          error={patientFieldError(errors, 'emergencyContact.fullName')}
          required
          placeholder="Jane Doe"
        />
        <div>
          <label className={`${FORM_FIELD_LABEL} mb-space-1.5`}>
            Relationship <span className={`${TONE.danger.fg} ml-space-1`}>*</span>
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
          {patientFieldError(errors, 'emergencyContact.relationship') && (
            <p className={`mt-space-1 ${FIELD_ERROR}`}>
              {patientFieldError(errors, 'emergencyContact.relationship')}
            </p>
          )}
        </div>
        <Input
          inferIcon
          label="Contact Phone"
          name="emergencyContactPhone"
          type="tel"
          value={phone.value ?? ''}
          onChange={phone.onChange}
          error={patientFieldError(errors, 'emergencyContact.phone')}
          required
          placeholder="(555) 987-6543"
        />
        <Input
          inferIcon
          label="Contact Email"
          name="emergencyContactEmail"
          type="email"
          value={email.value ?? ''}
          onChange={email.onChange}
          error={patientFieldError(errors, 'emergencyContact.email')}
          placeholder="contact@email.com"
        />
      </div>
    </div>
  );
};
