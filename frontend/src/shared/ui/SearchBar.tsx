/**
 * SearchBar Component
 * Search input with icon
 */

import React, { type InputHTMLAttributes } from 'react';
import { Icon } from './Icon';
import { ICONS } from '@/utils/icon-mappings';
import { cn } from '@/utils';

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
    if (onSearch) {
      onSearch(e.target.value);
    }
    if (props.onChange) {
      props.onChange(e);
    }
  };

  const sizeClasses = size === 'sm' ? 'h-[34px]' : 'py-2';
  const iconClasses = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <div className={cn('relative flex items-center gap-2 h-[34px] px-3 bg-surface border border-border-strong rounded-md hover:bg-surface-hover focus-within:outline-none focus-within:border-brand transition-colors duration-200', className)}>
      {/* Column 1: Left Icon */}
      <Icon
        name={ICONS.actions.search}
        className={cn('text-text-disabled', iconClasses, 'shrink-0')}
      />
      
      {/* Column 2: Input - flexible middle */}
      <input
        type="text"
        className={cn(
          'flex-1 min-w-0 text-xs font-medium bg-transparent border-0 outline-none',
          'placeholder:font-normal placeholder:text-text-muted',
          sizeClasses === 'h-[34px]' ? 'py-0' : ''
        )}
        {...props}
        onChange={handleChange}
      />
    </div>
  );
};
