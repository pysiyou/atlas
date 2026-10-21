/**
 * Debounced text field with optional leading/trailing slots.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from '@/components/primitives';
import { SpinnerLoader } from '@/components/feedback/SpinnerLoader';
import { cn } from '@/utils';
import { ICONS } from '@/config/icons';
import { inputWrapper, inputInner, inputText, inputClearButton, inputContainerError } from '@/theme/recipes';

export interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  invalid?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  'aria-label'?: string;
  className?: string;
  showClear?: boolean;
}

export const TextInput: React.FC<TextInputProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  debounceMs = 0,
  leading,
  trailing,
  invalid = false,
  inputMode,
  'aria-label': ariaLabel,
  className,
  showClear = true,
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (debounceMs <= 0) {
      if (localValue !== value) onChange(localValue);
      return;
    }
    if (localValue === value) {
      setIsPending(false);
      return;
    }
    setIsPending(true);
    const timer = setTimeout(() => {
      onChange(localValue);
      setIsPending(false);
    }, debounceMs);
    return () => {
      clearTimeout(timer);
      setIsPending(false);
    };
  }, [localValue, value, onChange, debounceMs]);

  const handleClear = useCallback(() => {
    setLocalValue('');
    onChange('');
  }, [onChange]);

  const handleChange = (next: string) => {
    setLocalValue(next);
    if (debounceMs <= 0) onChange(next);
  };

  return (
    <div className={cn(inputWrapper, invalid && inputContainerError, className)}>
      {leading}
      <input
        type="text"
        inputMode={inputMode}
        autoComplete="off"
        spellCheck={false}
        aria-label={ariaLabel}
        placeholder={placeholder}
        value={localValue}
        onChange={e => handleChange(e.target.value)}
        className={cn(inputInner, inputText)}
      />
      <div className="flex shrink-0 items-center gap-space-1">
        {trailing}
        {isPending && <SpinnerLoader size="xs" />}
        {showClear && localValue && !isPending && (
          <button
            onClick={handleClear}
            className={cn(inputClearButton, 'hover:bg-surface-page')}
            aria-label="Clear"
            type="button"
          >
            <Icon name={ICONS.actions.closeCircle} className="h-4 w-4 text-text-tertiary" />
          </button>
        )}
      </div>
    </div>
  );
};

/** Search field with icon and debounce — convenience over {@link TextInput}. */
export type SearchTextInputProps = Omit<TextInputProps, 'leading'> & {
  placeholder?: string;
};

export const SearchTextInput: React.FC<SearchTextInputProps> = props => (
  <TextInput
    {...props}
    debounceMs={props.debounceMs ?? 300}
    leading={
      <Icon
        name={ICONS.actions.search}
        className="w-3.5 h-3.5 shrink-0 text-text-muted group-hover:text-brand transition-colors"
      />
    }
  />
);
