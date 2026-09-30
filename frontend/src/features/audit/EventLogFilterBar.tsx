/**
 * Responsive filter bar for event log (no free-text search).
 */
import React, { useState, type ReactNode } from 'react';
import { actionButtonPreset, Badge, Button, Modal } from '@/components';
import { FILTER, FILTER_TYPE } from '@/components/theme/recipes';
import { cn } from '@/utils';
import { useBreakpoint, isBreakpointAtMost } from '@/hooks/useBreakpoint';
import { MODULE_ICONS } from '@/config/icons';
import { FilterModalFooter } from '@/components/filters/FilterModalFooter';
import { CheckboxList } from '@/components';
import { DatePresetBadges } from '@/components/filters';
import { EVENT_LOG_CATEGORY_OPTIONS } from './eventLogCategories';
import type { EventLogCategoryKey } from './types';

export interface EventLogFilterBarProps {
  activeFilterCount: number;
  inlineControls: ReactNode;
  modalExtras?: ReactNode;
  categories: EventLogCategoryKey[];
  onCategoriesChange: (values: EventLogCategoryKey[]) => void;
  dateRange: [Date, Date] | null;
  onDateRangeChange: (range: [Date, Date] | null) => void;
  onReset: () => void;
  showCategoryInModal?: boolean;
  showDateInModal?: boolean;
}

const categoryCheckboxOptions = EVENT_LOG_CATEGORY_OPTIONS.map(opt => ({
  id: opt.id,
  label: opt.label,
}));

export const EventLogFilterBar: React.FC<EventLogFilterBarProps> = ({
  activeFilterCount,
  inlineControls,
  modalExtras,
  categories,
  onCategoriesChange,
  dateRange,
  onDateRangeChange,
  onReset,
  showCategoryInModal,
  showDateInModal,
}) => {
  const breakpoint = useBreakpoint();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const showModalView = isBreakpointAtMost(breakpoint, 'sm');
  const showTwoColumn = breakpoint === 'md';

  if (showModalView) {
    return (
      <>
        <div className="w-full border-b border-border-default bg-surface">
          <div className="flex items-center justify-end gap-space-2 px-space-3 py-space-2">
            <div className="relative flex shrink-0">
              <Button {...actionButtonPreset('filter')} size="sm" onClick={() => setIsModalOpen(true)}>
                Filters
              </Button>
              {activeFilterCount > 0 && (
                <Badge
                  variant="primary"
                  size="xs"
                  className="absolute -top-space-1 -right-space-1 flex h-4 min-w-[18px] items-center justify-center px-space-1"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Filter events" size="md">
          <div className="flex h-full flex-col bg-surface">
            <div className="flex-1 space-y-space-5 overflow-y-auto px-space-5 py-space-4">
              {showCategoryInModal ? (
                <div className="w-full">
                  <h4 className={FILTER_TYPE.sectionTitle}>Category</h4>
                  <CheckboxList
                    options={categoryCheckboxOptions}
                    selectedIds={categories}
                    onChange={values => onCategoriesChange(values as EventLogCategoryKey[])}
                    columns={2}
                  />
                  <div className="mt-space-4 border-b border-border-default" />
                </div>
              ) : null}
              {showDateInModal ? (
                <div className="w-full">
                  <h4 className={FILTER_TYPE.sectionTitle}>Date range</h4>
                  <DatePresetBadges value={dateRange} onChange={onDateRangeChange} />
                  <div className="mt-space-4 border-b border-border-default" />
                </div>
              ) : null}
              {modalExtras}
            </div>
            <FilterModalFooter
              onReset={onReset}
              onApply={() => setIsModalOpen(false)}
              icon={MODULE_ICONS.eventLog}
              label="Event log"
            />
          </div>
        </Modal>
      </>
    );
  }

  if (showTwoColumn) {
    return (
      <div className={cn('w-full border-b border-border-default bg-surface')}>
        <div className={FILTER.barInsetCompact}>
          <div className={FILTER.mobileTwoCol}>{inlineControls}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full border-b border-border-default bg-surface">
      <div className={FILTER.barInset}>
        <div className={FILTER.barGridDesktop}>{inlineControls}</div>
      </div>
    </div>
  );
};
