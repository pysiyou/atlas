/**
 * Shared label + icon container + error chrome for in-input search tags.
 */
import type { ReactNode } from 'react';
import { Icon } from '@/components/primitives';
import type { IconKey } from '@/config/icons';
import { cn } from '@/utils';
import {
  inputContainerBase,
  inputContainerError,
  FORM_CONTROL_LABEL,
  FG,
  CONTROL,
  FIELD_ERROR,
  SPACING,
} from '@/theme/recipes';

/** Chip class shared by patient and test tags inside the search input. */
export const SELECTED_SEARCH_CHIP_CLASS =
  'max-w-[min(100%,20rem)] items-start gap-space-2 py-space-1-5 px-space-2 bg-surface-page border-border-default/80 shadow-none';

export interface SearchTagInputChromeProps {
  label: string;
  htmlFor: string;
  iconKey: IconKey;
  error?: string;
  disabled?: boolean;
  /** Optional count or hint aligned to the right of the label. */
  labelTrailing?: ReactNode;
  children: ReactNode;
}

/**
 * Label, leading icon, wrapping input well, and field error used by
 * PatientSelect and TestSelect. Chip/input children stay domain-specific.
 */
export function SearchTagInputChrome({
  label,
  htmlFor,
  iconKey,
  error,
  disabled = false,
  labelTrailing,
  children,
}: SearchTagInputChromeProps) {
  return (
    <div className="w-full">
      <div className="flex justify-between items-baseline mb-space-1 gap-space-2">
        <label htmlFor={htmlFor} className={FORM_CONTROL_LABEL}>
          {label}
        </label>
        {labelTrailing}
      </div>

      <div
        className={cn(
          inputContainerBase,
          `group relative ${SPACING.plSpace10} pr-space-3 py-space-2-5 flex flex-wrap gap-space-2 items-center ${CONTROL.heightMultiline}`,
          disabled && 'cursor-not-allowed',
          error && inputContainerError
        )}
      >
        <div className="absolute inset-y-0 left-0 pl-space-3 flex items-center pointer-events-none">
          <Icon
            iconKey={iconKey}
            className={`w-4 h-4 ${FG.muted} group-hover:text-brand transition-colors`}
          />
        </div>
        {children}
      </div>

      {error && <p className={`mt-space-1-5 ${FIELD_ERROR}`}>{error}</p>}
    </div>
  );
}
