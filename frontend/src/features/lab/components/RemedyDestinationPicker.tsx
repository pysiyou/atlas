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
  /** Detailed consequence preview for this remedy choice */
  consequences?: string[];
  /** Warning message for this remedy */
  warning?: string;
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
 * Build validation destination options from API allowedRemedies with rich consequence previews.
 */
export function buildValidationRemedyOptions(
  allowed: RemedyType[] | undefined,
  context?: {
    retestRemaining?: number;
    recollectionRemaining?: number;
    sampleRejected?: boolean;
    unfinishedTestsCount?: number;
    resultedTestsCount?: number;
    validatedTestsCount?: number;
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
      const consequences: string[] = [];
      let warning: string | undefined;
      
      // Build context-aware consequences and hints
      if (value === 'retry_same_sample') {
        if (context?.retestRemaining != null) {
          hint = REJECTION_DIALOG_COPY.actions.remaining(context.retestRemaining);
        }
        consequences.push('Test status: RESULTED → SUPERSEDED');
        consequences.push('New test created: SAMPLE_COLLECTED (same tube)');
        consequences.push('New result entry required');
        if (context?.retestRemaining === 0) {
          warning = 'Last retry attempt - next rejection will require escalation';
        }
      }
      
      if (value === 'request_recollection') {
        if (context?.recollectionRemaining != null) {
          hint = REJECTION_DIALOG_COPY.actions.remaining(context.recollectionRemaining);
        }
        consequences.push('Test status: RESULTED → SUPERSEDED');
        if (!context?.sampleRejected) {
          consequences.push('Sample status: COLLECTED → REJECTED');
        }
        consequences.push('Recollection request sent to supervisor');
        if (context?.unfinishedTestsCount) {
          consequences.push(`${context.unfinishedTestsCount} other unfinished test(s) will be reset to pending`);
        }
        if (context?.resultedTestsCount) {
          consequences.push(`${context.resultedTestsCount} other resulted test(s) stay in review`);
        }
        if (context?.validatedTestsCount) {
          consequences.push(`${context.validatedTestsCount} validated test(s) remain released`);
        }
        consequences.push('New sample created after supervisor approval');
        if (context?.recollectionRemaining === 0) {
          warning = 'Recollection limit reached - supervisor override required';
        }
      }
      
      if (value === 'cancel') {
        consequences.push('Test status: RESULTED → CANCELLED (terminal)');
        consequences.push('Test removed from order');
        consequences.push('No further work on this test');
      }
      
      if (value === 'escalate') {
        consequences.push('Test status: RESULTED → ESCALATED');
        consequences.push('Sent to supervisor queue');
        consequences.push('Supervisor will choose next action');
      }
      
      return {
        value,
        label: meta.label,
        description: meta.description,
        hint,
        consequences: consequences.length > 0 ? consequences : undefined,
        warning,
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
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-medium text-text-primary">
                  {option.label}
                  {option.hint ? (
                    <span className="text-text-tertiary font-normal ml-1">{option.hint}</span>
                  ) : null}
                </span>
                <span className="block text-xxs text-text-tertiary leading-snug mt-0.5">
                  {option.description}
                </span>
                
                {/* Rich consequence preview */}
                {option.consequences && option.consequences.length > 0 && (
                  <ul className="mt-1.5 space-y-0.5">
                    {option.consequences.map((consequence, idx) => (
                      <li key={idx} className="text-xxs text-text-secondary leading-tight flex items-start gap-1">
                        <span className="text-text-tertiary mt-0.5">•</span>
                        <span>{consequence}</span>
                      </li>
                    ))}
                  </ul>
                )}
                
                {/* Warning message */}
                {option.warning && (
                  <div className="mt-1.5 px-2 py-1 bg-warning/10 border border-warning/20 rounded text-xxs text-warning leading-tight">
                    ⚠️ {option.warning}
                  </div>
                )}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
};
