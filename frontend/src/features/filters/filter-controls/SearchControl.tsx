/**
 * SearchControl Component
 * Enhanced search input with debouncing and keyboard shortcuts
 */

import React, { useState, useEffect, useCallback } from 'react';
import { SearchBar } from '@/shared/ui';
import { Icon } from '@/shared/ui/Icon';
import { cn } from '@/utils';
import { ICONS } from '@/utils/icon-mappings';
import { brandColors, neutralColors } from '@/shared/design-system/tokens/colors';
import { filterInput } from '@/shared/design-system/tokens/components/filter';

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

  /**
   * Keyboard shortcut handler (Cmd+K / Ctrl+K)
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const input = document.querySelector('input[type="text"]') as HTMLInputElement;
        if (input) {
          input.focus();
          input.select();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={cn('relative w-full', className)}>
      <SearchBar
        placeholder={placeholder}
        value={localValue}
        onChange={handleChange}
        size="sm"
        className="w-full"
      />

      {/* Loading indicator */}
      {isDebouncing && (
        <div className="absolute right-10 top-1/2 -translate-y-1/2">
          <div className={`w-4 h-4 border-2 ${brandColors.primary.borderMedium} border-t-transparent rounded-full animate-spin`} />
        </div>
      )}

      {/* Clear button */}
      {localValue && !isDebouncing && (
        <button
          onClick={handleClear}
          className={cn('absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded transition-colors', filterInput.clearButton)}
          aria-label="Clear search"
        >
          <Icon name={ICONS.actions.closeCircle} className={cn('w-4 h-4', neutralColors.text.disabled, `hover:${neutralColors.text.tertiary}`)} />
        </button>
      )}
    </div>
  );
};
