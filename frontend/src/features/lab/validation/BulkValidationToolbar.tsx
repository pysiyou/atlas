/**
 * BulkValidationToolbar - Toolbar for bulk validation operations
 *
 * Provides:
 * - Select all / deselect all functionality
 * - Bulk approve action
 * - Selection count display
 */

import React, { useCallback, useMemo } from 'react';
import { Button, Icon } from '@/shared/ui';
import { cn } from '@/utils';
import { ICONS } from '@/utils/icon-mappings';

interface BulkValidationItem {
  id: number;
  orderId: number;
  testCode: string;
  hasCriticalValues?: boolean;
}

interface BulkValidationToolbarProps {
  items: BulkValidationItem[];
  selectedIds: Set<number>;
  onSelectionChange: (ids: Set<number>) => void;
  onBulkApprove: (ids: number[]) => Promise<void>;
  isProcessing?: boolean;
}

export const BulkValidationToolbar: React.FC<BulkValidationToolbarProps> = ({
  items,
  selectedIds,
  onSelectionChange,
  onBulkApprove,
  isProcessing = false,
}) => {
  const selectedCount = selectedIds.size;
  const totalCount = items.length;
  const allSelected = selectedCount === totalCount && totalCount > 0;
  const someSelected = selectedCount > 0 && selectedCount < totalCount;

  // Filter out items with critical values for bulk approve
  const approvableSelected = useMemo(() => {
    return items.filter(
      item => selectedIds.has(item.id) && !item.hasCriticalValues
    );
  }, [items, selectedIds]);

  const criticalSelectedCount = selectedCount - approvableSelected.length;

  /** Toggle all items */
  const handleToggleAll = useCallback(() => {
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(items.map(item => item.id)));
    }
  }, [allSelected, items, onSelectionChange]);

  /** Handle bulk approve */
  const handleBulkApprove = useCallback(async () => {
    if (approvableSelected.length === 0) return;

    const confirmMessage = criticalSelectedCount > 0
      ? `Are you sure you want to approve ${approvableSelected.length} result(s)?\n\nNote: ${criticalSelectedCount} item(s) with critical values will be skipped.`
      : `Are you sure you want to approve ${approvableSelected.length} result(s)?`;

    const confirmed = window.confirm(confirmMessage);

    if (confirmed) {
      await onBulkApprove(approvableSelected.map(item => item.id));
    }
  }, [approvableSelected, criticalSelectedCount, onBulkApprove]);

  /** Clear selection */
  const handleClearSelection = useCallback(() => {
    onSelectionChange(new Set());
  }, [onSelectionChange]);

  if (totalCount === 0) {
    return null;
  }

  // Show compact "Select All" checkbox when nothing is selected
  if (selectedCount === 0) {
    return (
      <div className="mb-4">
        <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-gray-700 hover:text-gray-900">
          <input
            type="checkbox"
            checked={false}
            onChange={handleToggleAll}
            className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
          />
          <span>Select All ({totalCount})</span>
        </label>
      </div>
    );
  }

  // Show full toolbar when items are selected
  return (
    <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-4">
      {/* Left side: Selection controls */}
      <div className="flex items-center gap-4">
        {/* Select all checkbox */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={allSelected}
            ref={input => {
              if (input) {
                input.indeterminate = someSelected;
              }
            }}
            onChange={handleToggleAll}
            className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
          />
          <span className="text-sm text-gray-700">
            {allSelected ? 'Deselect All' : 'Select All'}
          </span>
        </label>

        {/* Selection count */}
        {selectedCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">
              {selectedCount} of {totalCount} selected
            </span>
            <button
              onClick={handleClearSelection}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-3">
        {criticalSelectedCount > 0 && selectedCount > 0 && (
          <span className="text-xs text-amber-600 flex items-center gap-1">
            <Icon name={ICONS.actions.warning} className="w-3.5 h-3.5" />
            {criticalSelectedCount} critical value(s) will be skipped
          </span>
        )}

        <Button
          onClick={handleBulkApprove}
          disabled={approvableSelected.length === 0 || isProcessing}
          variant="approve"
          size="sm"
          className="min-w-[140px]"
        >
          {isProcessing ? (
            <>
              <Icon name={ICONS.actions.loading} className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Approve Selected ({approvableSelected.length})
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

/**
 * Checkbox component for individual items in a list
 */
interface ValidationCheckboxProps {
  id: number;
  isSelected: boolean;
  onToggle: (id: number) => void;
  disabled?: boolean;
}

export const ValidationCheckbox: React.FC<ValidationCheckboxProps> = ({
  id,
  isSelected,
  onToggle,
  disabled = false,
}) => {
  const handleChange = useCallback(() => {
    onToggle(id);
  }, [id, onToggle]);

  return (
    <input
      type="checkbox"
      checked={isSelected}
      onChange={handleChange}
      disabled={disabled}
      className={cn(
        'w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      onClick={e => e.stopPropagation()}
    />
  );
};

/**
 * Hook for managing bulk selection state
 */
export function useBulkSelection<T extends { id: number }>(items: T[]) {
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(new Set());

  const toggleItem = useCallback((id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(items.map(item => item.id)));
  }, [items]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback(
    (id: number) => selectedIds.has(id),
    [selectedIds]
  );

  /** Stable key: only changes when the set of item ids actually changes. */
  const itemsIdKey = useMemo(
    () =>
      items
        .map(item => item.id)
        .sort((a, b) => a - b)
        .join(','),
    [items]
  );

  /** Prune selection when the item list changes (e.g. filter/sort). */
  React.useEffect(() => {
    const itemIds = new Set(items.map(item => item.id));
    setSelectedIds(prev => {
      const next = new Set<number>();
      prev.forEach(id => {
        if (itemIds.has(id)) {
          next.add(id);
        }
      });
      return next;
    });
  }, [itemsIdKey]); // eslint-disable-line react-hooks/exhaustive-deps -- items from closure when itemsIdKey changes

  return {
    selectedIds,
    setSelectedIds,
    toggleItem,
    selectAll,
    clearSelection,
    isSelected,
    selectedCount: selectedIds.size,
    hasSelection: selectedIds.size > 0,
  };
}
