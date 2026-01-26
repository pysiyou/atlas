/**
 * SearchControl Component
 * Enhanced search input with debouncing and keyboard shortcuts
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from '@/shared/ui/Icon';
import { cn } from '@/utils';
import { ICONS } from '@/utils/icon-mappings';
import { brandColors, neutralColors } from '@/shared/design-system/tokens/colors';
import { filterInput } from '@/shared/design-system/tokens/components/filter';
import { filterControlSizing } from '@/shared/design-system/tokens/sizing';
import { radius } from '@/shared/design-system/tokens/borders';
import { hover, focus } from '@/shared/design-system/tokens/interactions';
import { transitions } from '@/shared/design-system/tokens/animations';

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
    <div className={cn('relative w-full flex items-center gap-2', filterControlSizing.height, 'px-3 bg-surface border', neutralColors.border.medium, radius.md, hover.background, focus.outline, `focus-within:${brandColors.primary.borderMedium}`, transitions.colors, className)}>
      {/* Column 1: Left Icon */}
      <Icon
        name={ICONS.actions.search}
        className={cn(neutralColors.text.disabled, 'w-3.5 h-3.5 shrink-0')}
      />

      {/* Column 2: Input - flexible middle */}
      <input
        type="text"
        placeholder={placeholder}
        value={localValue}
        onChange={handleChange}
        className={cn(
          'flex-1 min-w-0 text-xs font-medium bg-transparent border-0 outline-none py-0',
          'placeholder:font-normal',
          `placeholder:${neutralColors.text.muted}`
        )}
      />

      {/* Column 3: Right Icons (loading/clear) */}
      <div className="flex items-center gap-1 shrink-0">
        {isDebouncing && (
          <div className={cn('w-4 h-4 border-2 border-t-transparent rounded-full animate-spin', brandColors.primary.borderMedium)} />
        )}
        {localValue && !isDebouncing && (
          <button
            onClick={handleClear}
            className={cn('p-0.5', hover.background, 'rounded', transitions.colors, 'flex items-center justify-center cursor-pointer')}
            aria-label="Clear search"
          >
            <Icon name={ICONS.actions.closeCircle} className={cn('w-4 h-4', neutralColors.text.disabled, `hover:${neutralColors.text.tertiary}`)} />
          </button>
        )}
      </div>
    </div>
  );
};
