/**
 * FilterModal Component
 * Modal interface for filters on small screens
 */

import React from 'react';
import { Modal, ModalPageShell } from '@/components';
import { FILTER_TYPE } from '@/components/theme/recipes';
import { QuickFilters } from './QuickFilters';
import { FilterModalFooter } from './FilterModalFooter';
import type { FilterConfig, ActiveFilterBadge, FilterValues } from './types';
import { renderFilterControl } from './utils/renderFilterControl';

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
  const allFilterControls = config.primaryFilters.controls.filter(c => c.type !== 'search');

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
      <ModalPageShell
        tone="panel"
        bodyPadding="filter"
        footer={
          <FilterModalFooter
            onReset={onClearAll}
            onApply={handleApplyFilters}
            icon={config.footerIcon}
            label={config.footerLabel}
          />
        }
      >
        {searchControl && (
          <div className="mb-space-6">
            {renderFilterControl(
              searchControl,
              filters[searchControl.key],
              (value) => setFilter(searchControl.key, value),
              { variant: 'modal' }
            )}
          </div>
        )}

        {config.quickFilters && config.quickFilters.length > 0 && (
          <div className="mb-space-6">
            <QuickFilters
              presets={config.quickFilters}
              activePresetId={activePresetId}
              onPresetClick={onPresetClick}
            />
          </div>
        )}

        {allFilterControls.length > 0 && (
          <div className="space-y-space-5">
            {allFilterControls.map((control, index) => (
              <div key={control.key} className="w-full">
                <h4 className={FILTER_TYPE.sectionTitle}>{control.label}</h4>
                {renderModalControl(control)}
                {index < allFilterControls.length - 1 && (
                  <div className="border-b border-border-default mt-space-4" />
                )}
              </div>
            ))}
          </div>
        )}
      </ModalPageShell>
    </Modal>
  );
};
