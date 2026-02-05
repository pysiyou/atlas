import React, { useMemo } from 'react';
import { Input, MultiSelectFilter } from '@/shared/ui';
import type { FilterOption } from '@/shared/ui';
import { RELATIONSHIP_VALUES, RELATIONSHIP_CONFIG, type Relationship } from '@/types';
import { ICONS } from '@/utils';
import type { PatientFormSectionProps } from './types';

export const EmergencyContactSection: React.FC<
  Pick<PatientFormSectionProps, 'formData' | 'errors' | 'onFieldChange'>
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
          <label className="block text-xs font-medium text-fg-subtle mb-1.5">
            Relationship <span className="text-danger-fg ml-1">*</span>
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
            <p className="mt-1 text-sm text-danger-fg">{errors.emergencyContactRelationship}</p>
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
