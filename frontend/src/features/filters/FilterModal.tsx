/**
 * FilterModal Component
 * Modal interface for filters on small screens
 */

import React from 'react';
import { Modal, CheckboxList, FooterInfo, Button } from '@/shared/ui';
import { ICONS } from '@/utils';
import { QuickFilters } from './QuickFilters';
import { DatePresetBadges } from './DatePresetBadges';
import { ModalSearchInput, ModalPriceSlider, ModalRadioList } from './FilterModalControls';
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

  /**
   * Render a modal-specific filter control
   */
  const renderModalControl = (control: (typeof allFilterControls)[0]) => {
    const filterValue = filters[control.key];

    switch (control.type) {
      case 'multiSelect':
        return (
          <CheckboxList
            options={control.options}
            selectedIds={(filterValue as string[]) || []}
            onChange={value => setFilter(control.key, value)}
            columns={control.options.length > 4 ? 2 : 1}
          />
        );

      case 'singleSelect':
        return (
          <ModalRadioList
            options={control.options}
            selectedId={(filterValue as string | null) || null}
            onChange={value => setFilter(control.key, value)}
            columns={control.options.length > 4 ? 2 : 1}
          />
        );

      case 'priceRange': {
        const min = control.min ?? 0;
        const max = control.max ?? 10000;
        const currentValue = (filterValue as [number, number]) || [min, max];
        return (
          <ModalPriceSlider
            value={currentValue}
            onChange={value => setFilter(control.key, value)}
            min={min}
            max={max}
            currency={control.currency}
          />
        );
      }

      case 'dateRange':
        return (
          <DatePresetBadges
            value={(filterValue as [Date, Date] | null) || null}
            onChange={value => setFilter(control.key, value)}
          />
        );

      default:
        // For other control types (ageRange), fall back to label only
        return (
          <div className="text-sm text-fg-subtle italic">
            Use the main filter bar for this filter type
          </div>
        );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Filter"
      size="md"
    >
      <div className="flex flex-col h-full bg-panel">
        {/* Filter Controls - Scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Search Control */}
          {searchControl && (
            <div className="mb-6">
              <ModalSearchInput
                value={(filters[searchControl.key] as string) || ''}
                onChange={value => setFilter(searchControl.key, value)}
                placeholder={searchControl.placeholder}
              />
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
                  <h4 className="text-sm font-semibold text-fg mb-3">
                    {control.label}
                  </h4>
                  {/* Filter Options */}
                  {renderModalControl(control)}
                  {/* Separator line (except for last item) */}
                  {index < allFilterControls.length - 1 && (
                    <div className="border-b border-stroke mt-4" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with Filter Button */}
        <div className="px-5 py-4 border-t border-stroke bg-panel shrink-0">
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
