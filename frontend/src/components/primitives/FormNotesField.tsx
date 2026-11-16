/**
 * Labeled notes textarea — stacked label above control for popovers and forms.
 */
import { cn } from '@/utils';
import { FORM_FIELD_LABEL, inputBase } from '@/theme/recipes';

export interface FormNotesFieldProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  disabled?: boolean;
  className?: string;
  /** Hide the visible label (keep for screen readers). */
  srOnlyLabel?: boolean;
}

export function FormNotesField({
  id,
  label = 'Notes',
  value,
  onChange,
  placeholder = 'Optional additional details...',
  rows = 2,
  maxLength,
  disabled = false,
  className,
  srOnlyLabel = false,
}: FormNotesFieldProps) {
  return (
    <div className={cn('w-full min-w-0', className)}>
      <label
        htmlFor={id}
        className={srOnlyLabel ? 'sr-only' : cn(FORM_FIELD_LABEL, 'mb-space-1 block')}
      >
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        maxLength={maxLength}
        disabled={disabled}
        className={cn(inputBase, 'resize-none w-full')}
      />
    </div>
  );
}