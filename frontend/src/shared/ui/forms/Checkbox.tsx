/**
 * Checkbox - Single checkbox matching CheckboxList visual style (sr-only input + styled box + check icon).
 * Use for forms and modals; multi-option lists use CheckboxList.
 */

import React from 'react';
import { Icon } from '../display/Icon';
import { cn, ICONS } from '@/utils';

export interface CheckboxProps {
  id: string;
  name?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  id,
  name,
  checked,
  onChange,
  label,
  disabled = false,
  className,
}) => (
  <label
    htmlFor={id}
    className={cn(
      'flex items-center gap-3 cursor-pointer group py-1 transition-colors duration-200',
      disabled && 'opacity-50 cursor-not-allowed',
      className
    )}
  >
    <div className="relative flex items-center justify-center shrink-0">
      <input
        type="checkbox"
        id={id}
        name={name}
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only"
      />
      <div
        className={cn(
          'w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-150',
          checked ? 'bg-brand border-brand' : 'border-stroke bg-panel group-hover:border-brand',
          disabled && 'group-hover:border-stroke'
        )}
      >
        {checked && (
          <Icon name={ICONS.actions.check} className="w-3 h-3 text-on-brand" />
        )}
      </div>
    </div>
    <span
      className={cn(
        'text-sm transition-colors duration-200',
        checked ? 'text-fg' : 'text-fg-muted',
        !disabled && 'group-hover:text-fg'
      )}
    >
      {label}
    </span>
  </label>
);
