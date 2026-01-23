import React from 'react';
import { SectionContainer, Input, Select, Textarea } from '@/shared/ui';
import type { PriorityLevel } from '@/types';
import { PRIORITY_LEVEL_OPTIONS } from '@/types';

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
  return (
    <SectionContainer title="Order Details">
      <div className="space-y-4">
        <Input
          label="Referring Physician"
          value={referringPhysician}
          onChange={e => onReferringPhysicianChange(e.target.value)}
          placeholder="Dr. Smith"
        />

        <Select
          label="Priority"
          value={priority}
          onChange={e => onPriorityChange(e.target.value as PriorityLevel)}
          options={PRIORITY_LEVEL_OPTIONS}
          required
        />

        <Textarea
          label="Clinical Notes"
          value={clinicalNotes}
          onChange={e => onClinicalNotesChange(e.target.value)}
          placeholder="Clinical indication or reason for testing..."
          helperText="Include relevant symptoms, diagnosis, or reason for testing"
        />
      </div>
    </SectionContainer>
  );
};
