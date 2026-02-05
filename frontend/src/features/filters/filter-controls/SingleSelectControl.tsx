/**
 * SingleSelectControl Component
 * Single-select dropdown for filters
 */

import React from 'react';
import { Popover } from '@/shared/ui';
import { Icon, type IconName } from '@/shared/ui';
import { Badge } from '@/shared/ui';
import { inputTrigger, inputTriggerOpen } from '@/shared/ui/forms/inputStyles';
import { cn } from '@/utils';
import type { SingleSelectFilterControl } from '../types';
import { ICONS } from '@/utils';

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
        <span className="text-text-3">
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
          className={cn(inputTrigger, 'justify-between', isOpen && inputTriggerOpen, className)}
        >
          {/* Column 1: Left Icon */}
          {config.icon && (
            <Icon name={config.icon as IconName} className="w-4 h-4 text-text-muted group-hover:text-primary shrink-0 transition-colors" />
          )}

          {/* Column 2: Content - flexible middle */}
          <div className="flex-1 min-w-0 text-xs font-medium">{renderTriggerContent()}</div>

          {/* Column 3: Right Icons (clear + chevron) - close icon always reserves space */}
          <div className="flex items-center gap-1 shrink-0">
            {value ? (
              <button
                onClick={handleClear}
                className="p-0.5 hover:bg-surface-hover rounded transition-colors"
              >
                <Icon name={ICONS.actions.closeCircle} className="w-4 h-4 text-text-muted hover:text-text-3" />
              </button>
            ) : (
              <div className="w-5 h-5" />
            )}
            <Icon
              name={ICONS.actions.chevronDown}
              className={cn('w-4 h-4 text-text-muted transition-transform', isOpen && 'rotate-180')}
            />
          </div>
        </div>
      )}
      className=""
    >
      {() => (
        <div className="bg-surface border border-border rounded-md shadow-lg py-1 max-h-60 overflow-auto">
          {/* Options list */}
          <div>
            {config.options.map(option => {
              const isSelected = value === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() => handleSelect(option.id)}
                  className={cn(
                    'px-3 py-2 text-sm hover:bg-surface-hover cursor-pointer transition-colors duration-150 w-full flex items-center gap-2',
                    isSelected && 'bg-canvas',
                    'text-left'
                  )}
                >
                  {/* Check indicator */}
                  <div className="flex items-center justify-center w-4 h-4 shrink-0">
                    {isSelected ? (
                      <div className="w-4 h-4 rounded bg-primary flex items-center justify-center transition-all duration-150">
                        <Icon name={ICONS.actions.check} className="w-3 h-3 text-primary-on" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded border border-border" />
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
