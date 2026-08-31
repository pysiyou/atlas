/**
 * DebouncedSearchInput — filter-bar search with icon, clear button, and loading indicator.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from '@/components/primitives';
import { SpinnerLoader as DnaHelixLoader } from '@/components/loaders/SpinnerLoader';
import { ICONS, cn } from '@/utils';
import { inputWrapper, inputInner, inputText, inputClearButton } from './inputStyles';

export interface DebouncedSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Debounce delay in ms; default 300 */
  debounceMs?: number;
}

export const DebouncedSearchInput: React.FC<DebouncedSearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  debounceMs = 300,
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [isDebouncing, setIsDebouncing] = useState(false);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (localValue === value) {
      setIsDebouncing(false);
      return;
    }

    setIsDebouncing(true);
    const timer = setTimeout(() => {
      onChange(localValue);
      setIsDebouncing(false);
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      setIsDebouncing(false);
    };
  }, [localValue, value, onChange, debounceMs]);

  const handleClear = useCallback(() => {
    setLocalValue('');
    onChange('');
  }, [onChange]);

  return (
    <div className={cn(inputWrapper)}>
      <Icon
        name={ICONS.actions.search}
        className="w-3.5 h-3.5 shrink-0 text-text-muted group-hover:text-brand transition-colors"
      />
      <input
        type="text"
        placeholder={placeholder}
        value={localValue}
        onChange={e => setLocalValue(e.target.value)}
        className={cn(inputInner, inputText)}
      />
      <div className="flex items-center gap-1 shrink-0">
        {isDebouncing && <DnaHelixLoader size="xs" />}
        {localValue && !isDebouncing && (
          <button
            onClick={handleClear}
            className={cn(inputClearButton, 'hover:bg-surface-page')}
            aria-label="Clear search"
            type="button"
          >
            <Icon name={ICONS.actions.closeCircle} className="w-4 h-4 text-text-tertiary" />
          </button>
        )}
      </div>
    </div>
  );
};
