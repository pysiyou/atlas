/**
 * FilterModal Component
 * Modal interface for filters on small screens
 */

import React from 'react';
import { Modal, FooterInfo, Button } from '@/components';
import { ICONS } from '@/utils';
import { QuickFilters } from './QuickFilters';
import { renderFilterControl } from './utils/renderFilterControl';
import type { FilterConfig, ActiveFilterBadge, FilterValues } from './types';

export interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: FilterConfig;
  filters: FilterValues;
  setFilter: (key: string, value: unknown) => void;
  activeBadges: ActiveFilterBadge[];
  onClearAll: () => void;
  activePresetId: string | null;
  onPresetClick: (presetId: string) => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  config,
  filters,
  setFilter,
  onClearAll,
  activePresetId,
  onPresetClick,
}) => {
  // Get search and non-search controls
  const searchControl = config.primaryFilters.controls.find(c => c.type === 'search');
  const nonSearchControls = config.primaryFilters.controls.filter(c => c.type !== 'search');
  const advancedControls = config.advancedFilters?.controls || [];
  const allFilterControls = [...nonSearchControls, ...advancedControls];

  /**
   * Handle apply filters and close
   */
  const handleApplyFilters = () => {
    onClose();
  };

  const renderModalControl = (control: (typeof allFilterControls)[0]) =>
    renderFilterControl(control, filters[control.key], (value) => setFilter(control.key, value), {
      variant: 'modal',
    });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Filter" size="md">
      <div className="flex flex-col h-full bg-surface">
        {/* Filter Controls - Scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Search Control */}
          {searchControl && (
            <div className="mb-6">
              {renderFilterControl(
                searchControl,
                filters[searchControl.key],
                (value) => setFilter(searchControl.key, value),
                { variant: 'modal' }
              )}
            </div>
          )}

          {/* Quick Filters */}
          {config.quickFilters && config.quickFilters.length > 0 && (
            <div className="mb-6">
              <QuickFilters
                presets={config.quickFilters}
                activePresetId={activePresetId}
                onPresetClick={onPresetClick}
              />
            </div>
          )}

          {/* All Filter Controls - Each with its own label */}
          {allFilterControls.length > 0 && (
            <div className="space-y-5">
              {allFilterControls.map((control, index) => (
                <div key={control.key} className="w-full">
                  {/* Filter Label */}
                  <h4 className="text-sm font-semibold text-text-primary mb-3">{control.label}</h4>
                  {/* Filter Options */}
                  {renderModalControl(control)}
                  {/* Separator line (except for last item) */}
                  {index < allFilterControls.length - 1 && (
                    <div className="border-b border-border-default mt-4" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with Filter Button */}
        <div className="px-5 py-4 border-t border-border-default bg-surface shrink-0">
          <div className="flex items-center justify-between gap-3">
            <FooterInfo icon={ICONS.actions.filter} text="Filtering results" />
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onClearAll} showIcon={false}>
                Reset
              </Button>
              <Button variant="primary" onClick={handleApplyFilters} showIcon={false}>
                Filter
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
