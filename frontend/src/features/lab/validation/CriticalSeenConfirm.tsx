/**
 * Confirm-seen checkbox for critical results on the validation card and modal.
 */
import { Checkbox } from '@/components/primitives';
import { feedbackTitle } from '@/feedback';

export interface CriticalSeenConfirmProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

/**
 * Gates Approve until the validator confirms they saw the critical result.
 */
export function CriticalSeenConfirm({
  id,
  checked,
  onChange,
  disabled = false,
}: CriticalSeenConfirmProps) {
  return (
    <Checkbox
      id={id}
      name={id}
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      label={feedbackTitle('lab.validation.criticalSeen.label')}
    />
  );
}
