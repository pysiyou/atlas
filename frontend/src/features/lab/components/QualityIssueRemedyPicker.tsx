/**
 * QualityIssueRemedyPicker — explicit destination for validation / sample rejection.
 */
import React from 'react';
import type { RemedyType } from '@/types/lab-operations';
import { RadioCard } from './LabWorkflowPopoverChrome';
import { QUALITY_ISSUE_POPOVER_COPY } from './qualityIssuePopoverCopy';
import { FORM_FIELD_LABEL } from '@/components/inputs/inputStyles';

export interface RemedyOption {
  value: RemedyType;
  label: string;
  description: string;
  disabled?: boolean;
  hint?: string;
}

export interface RemedyDestinationPickerProps {
  label?: string;
  options: RemedyOption[];
  value: RemedyType | '';
  onChange: (value: RemedyType) => void;
  disabled?: boolean;
}

export const QualityIssueRemedyPicker: React.FC<RemedyDestinationPickerProps> = ({
  label = QUALITY_ISSUE_POPOVER_COPY.actions.followUpLabel,
  options,
  value,
  onChange,
  disabled = false,
}) => {
  if (options.length === 0) return null;

  return (
    <div>
      <label className={`${FORM_FIELD_LABEL} mb-1`}>{label}</label>
      <div className="grid grid-cols-1 gap-2">
        {options.map(option => {
          const labelText = option.hint ? `${option.label} ${option.hint}` : option.label;
          return (
            <RadioCard
              key={option.value}
              name="remedy-destination"
              selected={value === option.value}
              onClick={() => onChange(option.value)}
              label={labelText}
              description={option.description}
              disabled={option.disabled || disabled}
            />
          );
        })}
      </div>
    </div>
  );
};
