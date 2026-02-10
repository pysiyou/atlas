/**
 * SearchControl Component
 * Enhanced search input with debouncing and keyboard shortcuts
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Icon } from '@/shared/ui';
import { inputWrapper, inputInner, inputText } from '@/shared/ui/forms/inputStyles';
import { cn } from '@/utils';
import { ICONS } from '@/utils';

/**
 * Props for SearchControl component
 */
export interface SearchControlProps {
  /** Current search value */
  value: string;
  /** Callback when search value changes */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Debounce delay in milliseconds */
  debounceMs?: number;
  /** Custom className */
  className?: string;
}

/**
 * SearchControl Component
 *
 * Provides a search input with:
 * - Debounced input (300ms default)
 * - Loading indicator during debounce
 * - Clear button
 * - Keyboard shortcut (Cmd+K / Ctrl+K to focus)
 *
 * @component
 */
export const SearchControl: React.FC<SearchControlProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  debounceMs = 300,
  className,
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync local value when prop changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounce effect
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

  /**
   * Handle input change
   */
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  }, []);

  /**
   * Handle clear button click
   */
  const handleClear = useCallback(() => {
    setLocalValue('');
    onChange('');
  }, [onChange]);

  /** Keyboard shortcut (Cmd+K / Ctrl+K) focuses this control's input. */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={cn(inputWrapper, className)}>
      <Icon
        name={ICONS.actions.search}
        className="w-3.5 h-3.5 shrink-0 text-fg-faint group-hover:text-brand transition-colors"
      />
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={localValue}
        onChange={handleChange}
        className={cn(inputInner, inputText)}
      />

      {/* Column 3: Right Icons (loading/clear) */}
      <div className="flex items-center gap-1 shrink-0">
        {isDebouncing && (
          <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        )}
        {localValue && !isDebouncing && (
          <button
            onClick={handleClear}
            className="p-0.5 hover:bg-panel-hover rounded transition-colors duration-200 flex items-center justify-center cursor-pointer"
            aria-label="Clear search"
          >
            <Icon name={ICONS.actions.closeCircle} className="w-4 h-4 text-fg-faint hover:text-fg-subtle" />
          </button>
        )}
      </div>
    </div>
  );
};
