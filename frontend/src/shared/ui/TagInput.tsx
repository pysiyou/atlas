/**
 * TagInput Component
 *
 * A modern tag input component for managing lists of items (e.g., medications, allergies, conditions).
 * Allows users to add tags by typing and pressing Enter, and remove tags by clicking the X button.
 */

import React, { useState, type KeyboardEvent, type ChangeEvent } from 'react';
import { Icon } from './Icon';
import { Badge } from './Badge';
import { cn } from '@/utils';
import { ICONS } from '@/utils/icon-mappings';

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
        <div className="flex justify-between items-baseline mb-1 gap-2">
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-text-secondary cursor-pointer truncate min-w-0"
          >
            {label}
            {required && <span className="text-danger ml-1">*</span>}
          </label>
        </div>
      )}

      {/* Tags Container - matches result entry input height exactly */}
      <div
        className={cn(
          'w-full px-3 py-2 border rounded',
          'bg-surface transition-colors',
          'focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20',
          error ? 'border-danger' : 'border-border',
          'flex flex-wrap gap-2 items-center',
          // Ensure consistent height matching result entry inputs
          tags.length === 0 ? 'min-h-[42px]' : 'min-h-[42px]'
        )}
      >
        {/* Existing Tags */}
        {tags.map((tag, index) => (
          <Badge
            key={`${tag}-${index}`}
            variant={tagVariant === 'outline' ? 'primary' : tagVariant}
            size="sm"
            className="flex items-center gap-1.5 px-2 py-0.5 h-6"
          >
            <span className="text-xs font-medium leading-tight">{tag}</span>
            <button
              type="button"
              onClick={() => handleRemoveTag(tag)}
              className="flex items-center justify-center ml-0.5 -mr-0.5 hover:bg-black/10 rounded-full p-0.5 transition-colors focus:outline-none focus:ring-1 focus:ring-gray-400"
              aria-label={`Remove ${tag}`}
            >
              <Icon name={ICONS.actions.closeCircle} className="w-3 h-3 text-text-muted hover:text-text-secondary" />
            </button>
          </Badge>
        ))}

        {/* Input Field - matches result entry input styling exactly */}
        <input
          id={inputId}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] outline-none text-xs text-text-primary placeholder:text-text-disabled bg-transparent leading-[1.5]"
          disabled={maxTags !== undefined && tags.length >= maxTags}
        />
      </div>

      {/* Error Message */}
      {error && <p className="text-xs text-danger mt-1">{error}</p>}

      {/* Helper Text */}
      {helperText && !error && <p className="text-xs text-text-muted mt-1">{helperText}</p>}
    </div>
  );
};
