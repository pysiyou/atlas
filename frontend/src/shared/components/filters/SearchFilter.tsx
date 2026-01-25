/**
 * SearchFilter - Reusable search input component
 *
 * Provides a consistent search input with icon and clear functionality.
 * Used across all list views for text-based filtering.
 */

import React from 'react';
import { Icon } from '@/shared/ui';
import type { IconName } from '@/shared/ui/Icon';
import { ICONS } from '@/utils/icon-mappings';

export interface SearchFilterProps {
  /** Current search value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Icon to display (defaults to 'search') */
  icon?: IconName;
  /** Additional CSS classes */
  className?: string;
}

/**
 * SearchFilter component
 *
 * @example
 * ```tsx
 * <SearchFilter
 *   value={searchQuery}
 *   onChange={setSearchQuery}
 *   placeholder="Search patients..."
 * />
 * ```
 */
export const SearchFilter: React.FC<SearchFilterProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  icon = ICONS.actions.search,
  className = '',
}) => {
  const handleClear = () => {
    onChange('');
  };

  return (
    <div className={`relative ${className}`}>
      <Icon
        name={icon}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
      />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Clear search"
        >
          <Icon name={ICONS.actions.closeCircle} className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
