import React, { useMemo } from 'react';
import { Input, MultiSelectFilter, Textarea } from '@/shared/ui';
import type { PriorityLevel } from '@/types';
import { PRIORITY_LEVEL_OPTIONS } from '@/types';
import type { FilterOption } from '@/shared/ui/MultiSelectFilter';
import { ICONS } from '@/utils/icon-mappings';
import { semanticColors } from '@/shared/design-system/tokens/colors';

interface OrderDetailsFormProps {
  referringPhysician: string;
  priority: PriorityLevel;
  clinicalNotes: string;
  onReferringPhysicianChange: (value: string) => void;
  onPriorityChange: (value: PriorityLevel) => void;
  onClinicalNotesChange: (value: string) => void;
}

export const OrderForm: React.FC<OrderDetailsFormProps> = ({
  referringPhysician,
  priority,
  clinicalNotes,
  onReferringPhysicianChange,
  onPriorityChange,
  onClinicalNotesChange,
}) => {
  /**
   * Priority options styled like other single-select "multi select" controls in the app.
   * We use `MultiSelectFilter` with `singleSelect` enabled.
   */
  const priorityOptions: FilterOption[] = useMemo(
    () =>
      PRIORITY_LEVEL_OPTIONS.map(opt => {
        const color = opt.value === 'stat' ? 'danger' : opt.value === 'urgent' ? 'warning' : 'info';
        return { id: opt.value, label: opt.label, color };
      }),
    []
  );

  const selectedPriorityIds = useMemo(() => [priority], [priority]);

  const handlePriorityChange = (selectedIds: string[]) => {
    // Single-select mode: use the most recent selection.
    // If cleared, keep a safe default (routine) since priority is required.
    const next = (selectedIds[selectedIds.length - 1] as PriorityLevel | undefined) || 'routine';
    onPriorityChange(next);
  };

  return (
    <div className="space-y-4">
      <Input
        label="Referring physician"
        name="referringPhysician"
        icon={ICONS.dataFields.stethoscope}
        value={referringPhysician}
        onChange={e => onReferringPhysicianChange(e.target.value)}
        placeholder="e.g. Dr. Smith"
      />

      <div>
        <label className="block text-xs font-medium text-text-muted mb-1.5">
          Priority <span className={semanticColors.danger.requiredIndicator}>*</span>
        </label>
        <MultiSelectFilter
          label="Priority"
          options={priorityOptions}
          selectedIds={selectedPriorityIds}
          onChange={handlePriorityChange}
          placeholder="Select priority"
          showSelectAll={false}
          singleSelect={true}
          className="w-full sm:w-full"
          icon={ICONS.actions.warning}
        />
      </div>

      <Textarea
        label="Clinical notes"
        value={clinicalNotes}
        onChange={e => onClinicalNotesChange(e.target.value)}
        placeholder="Clinical indication or reason for testing..."
        helperText="Include relevant symptoms, diagnosis, or reason for testing"
        icon={ICONS.dataFields.clinicalNotes}
      />
    </div>
  );
};
