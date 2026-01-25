/**
 * FilterModal Component
 * Modal interface for filters on small screens
 *
 * Displays all filter controls in a modal dialog for small screen devices.
 * Provides a clean, scrollable interface with all filters and quick filters.
 */

import React from 'react';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { QuickFilters } from './QuickFilters';
import { FilterSection } from './FilterSection';
import type { FilterConfig, ActiveFilterBadge } from './types';

/**
 * Props for FilterModal component
 */
export interface FilterModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Filter configuration */
  config: FilterConfig;
  /** Active filter badges (used for Clear All visibility) */
  activeBadges: ActiveFilterBadge[];
  /** Callback to clear all filters */
  onClearAll: () => void;
  /** Currently active quick filter preset ID */
  activePresetId: string | null;
  /** Callback when a quick filter preset is clicked */
  onPresetClick: (presetId: string) => void;
  /** Function to render a filter control */
  renderControl: (control: FilterConfig['primaryFilters']['controls'][number]) => React.ReactNode;
  /** Function to count active filters in a section */
  countActiveInSection: (
    controls:
      | FilterConfig['primaryFilters']['controls']
      | NonNullable<FilterConfig['advancedFilters']>['controls']
  ) => number;
}

/**
 * FilterModal Component
 *
 * Provides a modal interface for filters on small screens with:
 * - All filter controls in a vertical stack
 * - Quick filters (if any)
 * - Close / Clear all actions
 *
 * @component
 */
export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  config,
  activeBadges,
  onClearAll,
  activePresetId,
  onPresetClick,
  renderControl,
  countActiveInSection,
}) => {
  // Get search and non-search controls
  const searchControl = config.primaryFilters.controls.find(c => c.type === 'search');
  const nonSearchControls = config.primaryFilters.controls.filter(c => c.type !== 'search');

  /**
   * Handle clear all and close
   */
  const handleClearAll = () => {
    onClearAll();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Filters"
      subtitle="Apply filters to refine your results"
      size="md"
      maxWidth="max-w-md"
    >
      <div className="flex flex-col h-full overflow-y-auto">
        {/* Quick Filters */}
        {config.quickFilters && config.quickFilters.length > 0 && (
          <div className="px-4 pt-4 pb-2 border-b border-gray-200">
            <QuickFilters
              presets={config.quickFilters}
              activePresetId={activePresetId}
              onPresetClick={onPresetClick}
            />
          </div>
        )}

        {/* Filter Controls */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Search Control */}
          {searchControl && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                {searchControl.label}
              </label>
              {renderControl(searchControl)}
            </div>
          )}

          {/* Primary Filters */}
          {nonSearchControls.length > 0 && (
            <FilterSection
              title={config.primaryFilters.title || 'Filters'}
              collapsible={false}
              activeCount={countActiveInSection(nonSearchControls)}
            >
              {nonSearchControls.map(control => (
                <div key={control.key} className="w-full">
                  {renderControl(control)}
                </div>
              ))}
            </FilterSection>
          )}

          {/* Advanced Filters */}
          {config.advancedFilters && config.advancedFilters.controls.length > 0 && (
            <FilterSection
              title={config.advancedFilters.title || 'Advanced Filters'}
              collapsible={true}
              defaultCollapsed={true}
              activeCount={countActiveInSection(config.advancedFilters.controls)}
            >
              {config.advancedFilters.controls.map(control => (
                <div key={control.key} className="w-full">
                  {renderControl(control)}
                </div>
              ))}
            </FilterSection>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          {activeBadges.length > 0 && (
            <Button variant="secondary" size="sm" onClick={handleClearAll}>
              Clear All
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
