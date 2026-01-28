/**
 * TagInput Component
 *
 * A modern tag input component for managing lists of items (e.g., medications, allergies, conditions).
 * Allows users to add tags by typing and pressing Enter, and remove tags by clicking the X button.
 */

import React, { useState, type KeyboardEvent, type ChangeEvent } from 'react';
import { Icon } from '../display/Icon';
import { cn } from '@/utils';
import { ICONS } from '@/utils';

export interface TagInputProps {
  /** Current tags as an array of strings */
  tags: string[];
  /** Callback when tags change */
  onChange: (tags: string[]) => void;
  /** Placeholder text for the input */
  placeholder?: string;
  /** Label for the input */
  label?: string;
  /** Error message to display */
  error?: string;
  /** Helper text to display */
  helperText?: string;
  /** Whether the input is required */
  required?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Maximum number of tags allowed */
  maxTags?: number;
  /** Variant for tag badges */
  tagVariant?: 'default' | 'primary' | 'secondary' | 'outline';
}

/**
 * TagInput - Component for managing a list of tags
 *
 * Features:
 * - Add tags by typing and pressing Enter
 * - Remove tags by clicking the X button
 * - Visual feedback with badges
 * - Validation support
 */
export const TagInput: React.FC<TagInputProps> = ({
  tags,
  onChange,
  placeholder = 'Type and press Enter to add',
  label,
  error,
  helperText,
  required = false,
  className = '',
  maxTags,
  tagVariant = 'outline',
}) => {
  const [inputValue, setInputValue] = useState('');

  /**
   * Handles adding a new tag
   */
  const handleAddTag = (value: string) => {
    const trimmedValue = value.trim();

    // Don't add empty tags or duplicates
    if (!trimmedValue || tags.includes(trimmedValue)) {
      return;
    }

    // Check max tags limit
    if (maxTags && tags.length >= maxTags) {
      return;
    }

    onChange([...tags, trimmedValue]);
    setInputValue('');
  };

  /**
   * Handles removing a tag
   */
  const handleRemoveTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  /**
   * Handles keyboard events in the input
   */
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(inputValue);
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      // Remove last tag when backspace is pressed on empty input
      handleRemoveTag(tags[tags.length - 1]);
    }
  };

  /**
   * Handles input change
   */
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const inputId = label?.toLowerCase().replace(/\s+/g, '-') || 'tag-input';

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <div className="flex justify-between items-baseline mb-1.5 gap-2">
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-text-tertiary cursor-pointer truncate min-w-0"
          >
            {label}
            {required && <span className="text-danger ml-1">*</span>}
          </label>
        </div>
      )}

      {/* Tags Container */}
      <div
        className={cn(
          'w-full px-3 py-2.5 border rounded',
          'bg-surface transition-colors',
          'flex flex-wrap gap-2 items-center',
          'min-h-[42px]',
          error
            ? 'border-danger focus-within:ring-2 focus-within:ring-brand focus-within:border-transparent'
            : 'border-border-strong focus-within:ring-2 focus-within:ring-brand focus-within:border-transparent'
        )}
      >
        {/* Existing Tags */}
        {tags.map((tag, index) => (
          <div
            key={`${tag}-${index}`}
            className="flex items-center gap-2 px-2 py-1 rounded bg-brand/10 border border-brand max-w-full shrink-0"
          >
            {/* Tag name */}
            <span className="text-xs font-medium text-text-primary truncate min-w-0">
              {tag}
            </span>
            {/* Clear button */}
            <button
              type="button"
              onClick={() => handleRemoveTag(tag)}
              className="flex items-center justify-center ml-0.5 -mr-0.5 hover:bg-brand/20 rounded-full p-0.5 transition-colors focus:outline-none focus:ring-1 focus:ring-brand/30 shrink-0"
              aria-label={`Remove ${tag}`}
            >
              <Icon name={ICONS.actions.closeCircle} className="w-3 h-3 text-text-tertiary hover:text-text-secondary" />
            </button>
          </div>
        ))}

        {/* Input Field */}
        <input
          id={inputId}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] outline-none text-xs text-text-primary placeholder:text-text-muted bg-transparent leading-normal"
          disabled={maxTags !== undefined && tags.length >= maxTags}
        />
      </div>

      {/* Error Message */}
      {error && <p className="text-xs text-danger mt-1.5">{error}</p>}

      {/* Helper Text */}
      {helperText && !error && <p className="text-xs text-text-tertiary mt-1.5">{helperText}</p>}
    </div>
  );
};
