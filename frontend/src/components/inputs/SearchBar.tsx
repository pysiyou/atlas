/**
 * SearchBar Component
 * Search input with icon
 */

import React, { type InputHTMLAttributes } from 'react';
import { Icon } from '@/components/primitives/Icon';
import { ICONS, cn } from '@/utils';
import { inputWrapper, inputInner, inputText } from './inputStyles';

/**
 * Note: This component is a direct input wrapper.
 * For search functionality that requires debouncing, implement the debounce logic
 * in the parent component or use a specialized hook.
 */

interface SearchBarProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  onSearch?: (value: string) => void;
  size?: 'sm' | 'default';
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  className = '',
  size = 'default',
  ...props
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onSearch) onSearch(e.target.value);
    props.onChange?.(e);
  };

  const iconClasses = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <div className={cn(inputWrapper, className)}>
      <Icon
        name={ICONS.actions.search}
        className={cn(
          'text-text-muted group-hover:text-brand transition-colors shrink-0',
          iconClasses
        )}
      />
      <input
        type="text"
        className={cn(inputInner, inputText, 'font-normal')}
        {...props}
        onChange={handleChange}
      />
    </div>
  );
};
