/**
 * ModalDebouncedSearch - Debounced text input with clear for filter modals.
 * Shared by FilterModal and PatientFilters.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from '@/shared/ui';
import { ICONS, cn } from '@/utils';
import { inputContainerBase, inputInner, inputText } from './inputStyles';

export interface ModalDebouncedSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Debounce delay in ms; default 300 */
  debounceMs?: number;
}

export const ModalDebouncedSearch: React.FC<ModalDebouncedSearchProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  debounceMs = 300,
}) => {
  const [localValue, setLocalValue] = useState(value);
  useEffect(() => setLocalValue(value), [value]);
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
        <button
          onClick={handleClear}
          className="p-0.5 hover:bg-panel-hover rounded transition-colors flex items-center justify-center cursor-pointer"
        >
          <Icon name={ICONS.actions.closeCircle} className="w-4 h-4 text-fg-subtle" />
        </button>
      )}
    </div>
  );
};
