/**
 * RemedyDestinationPicker — explicit destination for validation / sample rejection.
 * Operator must choose; the system only suggests.
 */
import React from 'react';
import type { RemedyType } from '@/types/lab-operations';
import { RadioCard } from './PopoverForm';
import { QUALITY_ISSUE_DIALOG_COPY } from './qualityIssueDialogConstants';

export interface RemedyOption {
  value: RemedyType;
  label: string;
  description: string;
  disabled?: boolean;
  hint?: string;
}

const VALIDATION_REMEDY_META: Record<
  Extract<RemedyType, 'retry_same_sample' | 'request_recollection' | 'cancel' | 'escalate'>,
  { label: string; description: string }
> = {
  retry_same_sample: {
    label: QUALITY_ISSUE_DIALOG_COPY.actions.retestLabel,
    description: QUALITY_ISSUE_DIALOG_COPY.actions.retestDescription,
  },
  request_recollection: {
    label: QUALITY_ISSUE_DIALOG_COPY.actions.newSampleLabel,
    description: QUALITY_ISSUE_DIALOG_COPY.actions.newSampleDescription,
  },
  cancel: {
    label: QUALITY_ISSUE_DIALOG_COPY.actions.cancelLabel,
    description: QUALITY_ISSUE_DIALOG_COPY.actions.cancelDescription,
  },
  escalate: {
    label: QUALITY_ISSUE_DIALOG_COPY.actions.escalateLabel,
    description: QUALITY_ISSUE_DIALOG_COPY.actions.escalateDescription,
  },
};

const SAMPLE_REMEDY_META: Record<
  Extract<RemedyType, 'request_recollection' | 'cancel'>,
  { label: string; description: string }
> = {
  request_recollection: {
    label: QUALITY_ISSUE_DIALOG_COPY.collection.actions.recollectLabel,
    description: QUALITY_ISSUE_DIALOG_COPY.collection.actions.recollectDescription,
  },
  cancel: {
    label: QUALITY_ISSUE_DIALOG_COPY.collection.actions.cancelUnfinishedLabel,
    description: QUALITY_ISSUE_DIALOG_COPY.collection.actions.cancelUnfinishedDescription,
  },
};

/**
 * Build validation destination options from API allowedRemedies.
 */
export function buildValidationRemedyOptions(
  allowed: RemedyType[] | undefined,
  context?: {
    retestRemaining?: number;
    recollectionRemaining?: number;
  }
): RemedyOption[] {
  const order: RemedyType[] = [
    'retry_same_sample',
    'request_recollection',
    'cancel',
    'escalate',
  ];
  const allowedSet = new Set(allowed ?? order);
  
  return order
    .filter(value => allowedSet.has(value) && value in VALIDATION_REMEDY_META)
    .map(value => {
      const meta = VALIDATION_REMEDY_META[value as keyof typeof VALIDATION_REMEDY_META];
      let hint: string | undefined;

      if (value === 'retry_same_sample' && context?.retestRemaining != null) {
        hint = QUALITY_ISSUE_DIALOG_COPY.actions.remaining(context.retestRemaining);
      }

      if (value === 'request_recollection' && context?.recollectionRemaining != null) {
        hint = QUALITY_ISSUE_DIALOG_COPY.actions.remaining(context.recollectionRemaining);
      }

      return {
        value,
        label: meta.label,
        description: meta.description,
        hint,
      };
    });
}

/**
 * Build sample unfinished-work options from API allowedRemedies.
 */
export function buildSampleRemedyOptions(allowed: RemedyType[] | undefined): RemedyOption[] {
  const order: RemedyType[] = ['request_recollection', 'cancel'];
  const allowedSet = new Set(allowed ?? order);
  return order
    .filter(value => allowedSet.has(value) && value in SAMPLE_REMEDY_META)
    .map(value => {
      const meta = SAMPLE_REMEDY_META[value as keyof typeof SAMPLE_REMEDY_META];
      return { value, label: meta.label, description: meta.description };
    });
}

export interface RemedyDestinationPickerProps {
  label?: string;
  options: RemedyOption[];
  value: RemedyType | '';
  onChange: (value: RemedyType) => void;
  disabled?: boolean;
}

export const RemedyDestinationPicker: React.FC<RemedyDestinationPickerProps> = ({
  label = QUALITY_ISSUE_DIALOG_COPY.actions.followUpLabel,
  options,
  value,
  onChange,
  disabled = false,
}) => {
  if (options.length === 0) return null;

  return (
    <div>
      <label className="block text-xs font-normal text-text-tertiary mb-1">{label}</label>
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
