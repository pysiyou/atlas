/**
 * SingleSelectControl Component
 * Single-select dropdown for filters
 */

import React from 'react';
import { Popover, Icon, Badge, FilterTriggerShell } from '@/shared/ui';
import type { IconName } from '@/shared/ui';
import { cn, uppercaseLabel, ICONS } from '@/utils';
import type { SingleSelectFilterControl } from '../types';

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
        <span className="text-text-muted">
          {config.placeholder || `Select ${config.label.toLowerCase()}...`}
        </span>
      );
    }

    return (
      <Badge variant={selectedOption.color || 'default'} size="xs">
        {uppercaseLabel(selectedOption.label)}
      </Badge>
    );
  };

  return (
    <Popover
      placement="bottom-start"
      showBackdrop={false}
      trigger={({ isOpen }) => (
        <FilterTriggerShell
          isOpen={isOpen}
          leftIcon={
            config.icon ? (
              <Icon name={config.icon as IconName} className="w-4 h-4 text-text-muted group-hover:text-brand shrink-0 transition-colors" />
            ) : undefined
          }
          showClear={!!value}
          onClear={handleClear}
          className={className}
        >
          {renderTriggerContent()}
        </FilterTriggerShell>
      )}
      className=""
    >
      {() => (
        <div className="bg-surface border border-border-default rounded-md shadow-lg py-1 max-h-60 overflow-auto">
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
                    isSelected && 'bg-surface-page',
                    'text-left'
                  )}
                >
                  {/* Check indicator */}
                  <div className="flex items-center justify-center w-4 h-4 shrink-0">
                    {isSelected ? (
                      <div className="w-4 h-4 rounded bg-brand flex items-center justify-center transition-all duration-150">
                        <Icon name={ICONS.actions.check} className="w-3 h-3 text-on-brand" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded border border-border-default" />
                    )}
                  </div>

                  {/* Badge */}
                  <Badge variant={option.color || 'default'} size="sm">
                    {uppercaseLabel(option.label)}
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
