/**
 * QualityIssueRemedyPicker — explicit destination for validation / sample rejection.
 */
import type { RemedyType } from '@/types';
import { RadioCard } from '@/components/overlays';
import { QUALITY_ISSUE_POPOVER_COPY, type RemedyOption } from '../constants/qualityIssuePopoverCopy';
import { FORM_FIELD_LABEL } from '@/theme/recipes';

export type { RemedyOption };

export interface RemedyDestinationPickerProps {
  label?: string;
  options: RemedyOption[];
  value: RemedyType | '';
  onChange: (value: RemedyType) => void;
  disabled?: boolean;
}

export function QualityIssueRemedyPicker({
  label = QUALITY_ISSUE_POPOVER_COPY.actions.followUpLabel,
  options,
  value,
  onChange,
  disabled = false,
}: RemedyDestinationPickerProps) {
  if (options.length === 0) return null;

  return (
    <div>
      <label className={`${FORM_FIELD_LABEL} mb-space-1`}>{label}</label>
      <div className="grid grid-cols-1 gap-space-2">
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
}
