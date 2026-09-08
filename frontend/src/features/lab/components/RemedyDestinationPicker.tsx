/**
 * RemedyDestinationPicker — explicit destination for validation / sample rejection.
 * Operator must choose; the system only suggests.
 */
import React from 'react';
import { cn } from '@/utils';
import type { RemedyType } from '@/types/lab-operations';
import { REJECTION_DIALOG_COPY } from './rejectionDialogConstants';

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
    label: REJECTION_DIALOG_COPY.actions.retestLabel,
    description: REJECTION_DIALOG_COPY.actions.retestDescription,
  },
  request_recollection: {
    label: REJECTION_DIALOG_COPY.actions.newSampleLabel,
    description: REJECTION_DIALOG_COPY.actions.newSampleDescription,
  },
  cancel: {
    label: REJECTION_DIALOG_COPY.actions.cancelLabel,
    description: REJECTION_DIALOG_COPY.actions.cancelDescription,
  },
  escalate: {
    label: REJECTION_DIALOG_COPY.actions.escalateLabel,
    description: REJECTION_DIALOG_COPY.actions.escalateDescription,
  },
};

const SAMPLE_REMEDY_META: Record<
  Extract<RemedyType, 'request_recollection' | 'cancel'>,
  { label: string; description: string }
> = {
  request_recollection: {
    label: REJECTION_DIALOG_COPY.collection.actions.recollectLabel,
    description: REJECTION_DIALOG_COPY.collection.actions.recollectDescription,
  },
  cancel: {
    label: REJECTION_DIALOG_COPY.collection.actions.cancelUnfinishedLabel,
    description: REJECTION_DIALOG_COPY.collection.actions.cancelUnfinishedDescription,
  },
};

/**
 * Build validation destination options from API allowedRemedies.
 */
export function buildValidationRemedyOptions(
  allowed: RemedyType[] | undefined,
  hints?: { retestRemaining?: number; recollectionRemaining?: number }
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
      if (value === 'retry_same_sample' && hints?.retestRemaining != null) {
        hint = REJECTION_DIALOG_COPY.actions.remaining(hints.retestRemaining);
      }
      if (value === 'request_recollection' && hints?.recollectionRemaining != null) {
        hint = REJECTION_DIALOG_COPY.actions.remaining(hints.recollectionRemaining);
      }
      return { value, label: meta.label, description: meta.description, hint };
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
  label = REJECTION_DIALOG_COPY.actions.followUpLabel,
  options,
  value,
  onChange,
  disabled = false,
}) => {
  if (options.length === 0) return null;

  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className="text-xs font-medium text-text-secondary">{label}</legend>
      <div className="space-y-1.5">
        {options.map(option => {
          const selected = value === option.value;
          return (
            <label
              key={option.value}
              className={cn(
                'flex gap-2.5 rounded-md border px-2.5 py-2 cursor-pointer transition-colors',
                selected
                  ? 'border-brand bg-brand/5'
                  : 'border-border-subtle hover:border-border-strong',
                option.disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <input
                type="radio"
                className="mt-0.5 shrink-0"
                name="remedy-destination"
                value={option.value}
                checked={selected}
                disabled={option.disabled || disabled}
                onChange={() => onChange(option.value)}
              />
              <span className="min-w-0">
                <span className="block text-xs font-medium text-text-primary">
                  {option.label}
                  {option.hint ? (
                    <span className="text-text-tertiary font-normal">{option.hint}</span>
                  ) : null}
                </span>
                <span className="block text-xxs text-text-tertiary leading-snug mt-0.5">
                  {option.description}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
};
