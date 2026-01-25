/**
 * SearchBar Component
 * Search input with icon
 */

import React, { type InputHTMLAttributes } from 'react';
import { Icon } from './Icon';
import { ICONS } from '@/utils/icon-mappings';
import { getInputClasses } from '@/shared/design-system/tokens/components/input';
import { filterControlSizing, iconSizes } from '@/shared/design-system/tokens/sizing';
import { neutralColors } from '@/shared/design-system/tokens/colors';

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

  const sizeClasses = size === 'sm' ? `py-1.5 text-xs ${filterControlSizing.height}` : 'py-2 text-sm';
  const iconClasses = size === 'sm' ? 'w-3.5 h-3.5' : iconSizes.sm;

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon
          name={ICONS.actions.search}
          className={`${neutralColors.text.disabled} ${iconClasses}`}
        />
      </div>
      <input
        type="text"
        className={`${getInputClasses(false, true, 'left', size === 'sm' ? 'sm' : 'md', false)} pl-9 pr-4 ${sizeClasses} font-medium focus:border-sky-500 placeholder:${neutralColors.text.muted} placeholder:font-normal`}
        {...props}
        onChange={handleChange}
      />
    </div>
  );
};
