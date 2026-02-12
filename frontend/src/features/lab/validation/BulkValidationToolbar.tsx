/**
 * BulkValidationToolbar - Toolbar for bulk validation operations
 *
 * Provides:
 * - Select all / deselect all functionality
 * - Bulk approve action
 * - Selection count display
 */

import React, { useCallback, useMemo } from 'react';
import { Button, ClaudeLoader } from '@/shared/ui';
import { cn } from '@/utils';

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
  /** Enable/disable the bulk validation feature */
  enabled?: boolean;
}

export const BulkValidationToolbar: React.FC<BulkValidationToolbarProps> = ({
  items,
  selectedIds,
  onSelectionChange,
  onBulkApprove,
  isProcessing = false,
  enabled = true,
}) => {
  const selectedCount = selectedIds.size;
  const totalCount = items.length;
  const allSelected = selectedCount === totalCount && totalCount > 0;
  const someSelected = selectedCount > 0 && selectedCount < totalCount;

  // Filter out items with critical values for bulk approve
  const approvableSelected = useMemo(() => {
    if (!enabled) return [];
    return items.filter(
      item => selectedIds.has(item.id) && !item.hasCriticalValues
    );
  }, [items, selectedIds, enabled]);

  const criticalSelectedCount = selectedCount - approvableSelected.length;

  /** Toggle all items */
  const handleToggleAll = useCallback(() => {
    if (!enabled) return;
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(items.map(item => item.id)));
    }
  }, [allSelected, items, onSelectionChange, enabled]);

  /** Handle bulk approve */
  const handleBulkApprove = useCallback(async () => {
    if (!enabled || approvableSelected.length === 0) return;

    const confirmMessage = criticalSelectedCount > 0
      ? `Are you sure you want to approve ${approvableSelected.length} result(s)?\n\nNote: ${criticalSelectedCount} item(s) with critical values will be skipped.`
      : `Are you sure you want to approve ${approvableSelected.length} result(s)?`;

    const confirmed = window.confirm(confirmMessage);

    if (confirmed) {
      await onBulkApprove(approvableSelected.map(item => item.id));
    }
  }, [approvableSelected, criticalSelectedCount, onBulkApprove, enabled]);

  /** Clear selection */
  const handleClearSelection = useCallback(() => {
    if (!enabled) return;
    onSelectionChange(new Set());
  }, [onSelectionChange, enabled]);

  // Return null if feature is disabled or no items
  if (!enabled || totalCount === 0) {
    return null;
  }

  // Show simple "Select All" checkbox when nothing is selected
  if (selectedCount === 0) {
    return (
      <div className="mb-3">
        <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-text-tertiary">
          <input
            type="checkbox"
            checked={false}
            onChange={handleToggleAll}
            className="w-4 h-4 text-brand border-border-strong rounded focus:ring-2 focus:ring-brand/20"
          />
          <span>Select all {totalCount} items</span>
        </label>
      </div>
    );
  }

  // Show simple toolbar when items are selected
  return (
    <div className="flex items-center justify-between mb-3">
      {/* Left side: Selection controls */}
      <div className="flex items-center gap-3">
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
            className="w-4 h-4 text-brand border-border-strong rounded focus:ring-2 focus:ring-brand/20"
          />
          <span className="text-sm text-text-tertiary">
            {allSelected ? 'Deselect all' : 'Select all'}
          </span>
        </label>

        {/* Selection count */}
        <span className="text-sm text-text-tertiary">
          {selectedCount} selected
        </span>

        {/* Clear button */}
        <button
          onClick={handleClearSelection}
          className="text-sm text-text-tertiary hover:text-text-secondary"
        >
          Clear
        </button>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-3">
        {criticalSelectedCount > 0 && selectedCount > 0 && (
          <span className="text-xs text-warning-fg">
            {criticalSelectedCount} critical skipped
          </span>
        )}

        <Button
          onClick={handleBulkApprove}
          disabled={approvableSelected.length === 0 || isProcessing}
          variant="approve"
          size="sm"
        >
          {isProcessing ? (
            <>
              <span className="mr-2 inline-flex shrink-0">
              <ClaudeLoader size="xs" color="currentColor" />
            </span>
              Processing...
            </>
          ) : (
            `Approve (${approvableSelected.length})`
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
        'w-4 h-4 text-brand border-border-strong rounded focus:ring-2 focus:ring-brand/20',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      onClick={e => e.stopPropagation()}
    />
  );
};

/**
 * Hook for managing bulk selection state
 */
// eslint-disable-next-line react-refresh/only-export-components
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
