/**
 * SingleSelectControl Component
 * Single-select dropdown for filters
 */

import React from 'react';
import { Popover } from '@/shared/ui/Popover';
import { Icon, type IconName } from '@/shared/ui/Icon';
import { Badge } from '@/shared/ui/Badge';
import { cn } from '@/utils';
import type { SingleSelectFilterControl } from '../types';
import { ICONS } from '@/utils/icon-mappings';

/**
 * Props for SingleSelectControl component
 */
export interface SingleSelectControlProps {
  /** Currently selected option ID */
  value: string | null;
  /** Callback when selection changes */
  onChange: (value: string | null) => void;
  /** Filter control configuration */
  config: SingleSelectFilterControl;
  /** Custom className */
  className?: string;
}

/**
 * SingleSelectControl Component
 *
 * Provides a single-select dropdown similar to MultiSelectFilter but for single selection.
 *
 * @component
 */
export const SingleSelectControl: React.FC<SingleSelectControlProps> = ({
  value,
  onChange,
  config,
  className,
}) => {
  const selectedOption = config.options.find(opt => opt.id === value);

  /**
   * Handle option selection
   */
  const handleSelect = (optionId: string) => {
    if (value === optionId) {
      // Deselect if already selected
      onChange(null);
    } else {
      onChange(optionId);
    }
  };

  /**
   * Handle clear
   */
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  /**
   * Render trigger content
   */
  const renderTriggerContent = () => {
    if (!selectedOption) {
      return (
        <span className="text-gray-500">
          {config.placeholder || `Select ${config.label.toLowerCase()}...`}
        </span>
      );
    }

    return (
      <Badge variant={selectedOption.color || 'default'} size="xs">
        {selectedOption.label.toUpperCase()}
      </Badge>
    );
  };

  return (
    <Popover
      placement="bottom-start"
      showBackdrop={false}
      trigger={({ isOpen }) => (
        <div
          className={cn(
            'inline-flex items-center gap-2 px-3 py-1.5 h-[34px] min-h-[34px] max-h-[34px] bg-white border rounded cursor-pointer transition-colors w-full sm:w-[240px] overflow-hidden',
            isOpen
              ? 'border-sky-500 ring-2 ring-sky-500/20'
              : 'border-gray-300 hover:border-gray-400',
            className
          )}
        >
          {/* Icon */}
          {config.icon && (
            <Icon name={config.icon as IconName} className="w-4 h-4 text-gray-400 shrink-0" />
          )}

          {/* Content */}
          <div className="flex-1 min-w-0 text-xs truncate ml-1">{renderTriggerContent()}</div>

          {/* Chevron */}
          <Icon
            name={ICONS.actions.chevronDown}
            className={cn(
              'w-4 h-4 text-gray-400 transition-transform shrink-0',
              isOpen && 'rotate-180'
            )}
          />

          {/* Clear button */}
          {value && (
            <button
              onClick={handleClear}
              className="p-0.5 -mr-1 hover:bg-gray-100 rounded transition-colors flex items-center justify-center cursor-pointer shrink-0"
            >
              <Icon name={ICONS.actions.closeCircle} className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
      )}
      className="min-w-[280px]"
    >
      {() => (
        <div className="flex flex-col py-1">
          {/* Options list */}
          <div className="max-h-[300px] overflow-y-auto">
            {config.options.map(option => {
              const isSelected = value === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => handleSelect(option.id)}
                  className={cn(
                    'w-full flex items-center px-4 py-2.5 cursor-pointer transition-all duration-150 text-left',
                    'hover:bg-gray-50/80',
                    isSelected && 'bg-sky-50/30'
                  )}
                >
                  {/* Check indicator */}
                  <div className="shrink-0 mr-3">
                    {isSelected ? (
                      <div className="w-5 h-5 rounded-md flex items-center justify-center bg-sky-500 transition-all duration-150">
                        <Icon name={ICONS.actions.check} className="w-3.5 h-3.5 text-white" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-md border-2 border-gray-300" />
                    )}
                  </div>

                  {/* Badge */}
                  <Badge variant={option.color || 'default'} size="sm">
                    {option.label.toUpperCase()}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </Popover>
  );
};
