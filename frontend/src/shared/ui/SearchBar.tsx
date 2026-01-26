/**
 * SearchBar Component
 * Search input with icon
 */

import React, { type InputHTMLAttributes } from 'react';
import { Icon } from './Icon';
import { ICONS } from '@/utils/icon-mappings';
import { filterControlSizing, iconSizes } from '@/shared/design-system/tokens/sizing';
import { neutralColors } from '@/shared/design-system/tokens/colors';
import { hover, focus } from '@/shared/design-system/tokens/interactions';
import { transitions } from '@/shared/design-system/tokens/animations';
import { radius } from '@/shared/design-system/tokens/borders';
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

  const sizeClasses = size === 'sm' ? filterControlSizing.height : 'py-2';
  const iconClasses = size === 'sm' ? 'w-3.5 h-3.5' : iconSizes.sm;

  return (
    <div className={cn('relative flex items-center gap-2', filterControlSizing.height, 'px-3 bg-surface border', neutralColors.border.medium, radius.md, hover.background, focus.outline, 'focus-within:border-brand', transitions.colors, className)}>
      {/* Column 1: Left Icon */}
      <Icon
        name={ICONS.actions.search}
        className={cn(neutralColors.text.disabled, iconClasses, 'shrink-0')}
      />
      
      {/* Column 2: Input - flexible middle */}
      <input
        type="text"
        className={cn(
          'flex-1 min-w-0 text-xs font-medium bg-transparent border-0 outline-none',
          'placeholder:font-normal',
          `placeholder:${neutralColors.text.muted}`,
          sizeClasses === filterControlSizing.height ? 'py-0' : ''
        )}
        {...props}
        onChange={handleChange}
      />
    </div>
  );
};
