/**
 * OverlaySearchInput - Debounced text input with clear for filter modals/popovers.
 * Shared by FilterModal and PatientFilters.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from '@/components/primitives';
import { ICONS, cn } from '@/utils';
import { inputContainerBase, inputInner, inputText, inputClearButton } from '@/components/inputs/inputStyles';

export interface OverlaySearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Debounce delay in ms; default 300 */
  debounceMs?: number;
}

export const OverlaySearchInput: React.FC<OverlaySearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  debounceMs = 300,
}) => {
  const [localValue, setLocalValue] = useState(value);
  useEffect(() => {
    setLocalValue(value);
  }, [value]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (localValue !== value) onChange(localValue);
    }, debounceMs);
    return () => clearTimeout(t);
  }, [localValue, value, onChange, debounceMs]);
  const handleClear = useCallback(() => {
    setLocalValue('');
    onChange('');
  }, [onChange]);

  return (
    <div className={cn(inputContainerBase, 'flex items-center h-10 px-4')}>
      <input
        type="text"
        placeholder={placeholder}
        value={localValue}
        onChange={e => setLocalValue(e.target.value)}
        className={cn(inputInner, inputText)}
      />
      {localValue && (
        <button onClick={handleClear} className={cn(inputClearButton, 'hover:bg-surface-hover')}>
          <Icon name={ICONS.actions.closeCircle} className="w-4 h-4 text-text-tertiary" />
        </button>
      )}
    </div>
  );
};

