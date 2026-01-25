/**
 * SearchBar Component
 * Search input with icon
 */

import React, { type InputHTMLAttributes } from 'react';
import { Icon } from './Icon';
import { ICONS } from '@/utils/icon-mappings';

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

  const sizeClasses = size === 'sm' ? 'py-1.5 text-xs h-[34px]' : 'py-2 text-sm';

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon
          name={ICONS.actions.search}
          className={`text-gray-400 ${size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'}`}
        />
      </div>
      <input
        type="text"
        className={`w-full pl-9 pr-4 ${sizeClasses} bg-white text-gray-700 font-medium border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 placeholder:text-gray-500 placeholder:font-normal`}
        {...props}
        onChange={handleChange}
      />
    </div>
  );
};
