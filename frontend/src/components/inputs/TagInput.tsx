/**
 * TagInput Component
 *
 * A modern tag input component for managing lists of items (e.g., medications, allergies, conditions).
 * Allows users to add tags by typing and pressing Enter, and remove tags by clicking the X button.
 */

import React, { useState, type KeyboardEvent, type ChangeEvent } from 'react';
import { RemovableTag } from '@/components';
import { cn } from '@/utils';
import { inputContainerBase, inputContainerError, FORM_CONTROL_LABEL } from './inputStyles';
import { TONE, TYPE } from '@/components/theme/recipes';


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
}

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
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleAddTag = (value: string) => {
    const trimmedValue = value.trim();
    if (!trimmedValue || tags.includes(trimmedValue)) return;
    if (maxTags && tags.length >= maxTags) return;
    onChange([...tags, trimmedValue]);
    setInputValue('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag(inputValue);
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      handleRemoveTag(tags[tags.length - 1]);
    }
  };

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
            className={FORM_CONTROL_LABEL}
          >
            {label}
            {required && <span className={`${TONE.danger.fg} ml-1`}>*</span>}
          </label>
        </div>
      )}

      <div
        className={cn(
          inputContainerBase,
          'px-3 py-2.5 flex flex-wrap gap-2 items-center min-h-[42px]',
          error && inputContainerError
        )}
      >
        {tags.map(tag => (
          <RemovableTag
            key={tag}
            size="xs"
            onRemove={() => handleRemoveTag(tag)}
            removeAriaLabel={`Remove ${tag}`}
          >
            <span className="min-w-0 truncate font-normal">{tag}</span>
          </RemovableTag>
        ))}

        <input
          id={inputId}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ''}
          className={`flex-1 min-w-[120px] outline-none ${TYPE.value} placeholder:text-text-muted bg-transparent leading-normal`}
          disabled={maxTags !== undefined && tags.length >= maxTags}
        />
      </div>

      {error && <p className={`text-xs ${TONE.danger.fg} mt-1.5`}>{error}</p>}
      {helperText && !error && <p className={`${TYPE.meta} mt-1.5`}>{helperText}</p>}
    </div>
  );
};
