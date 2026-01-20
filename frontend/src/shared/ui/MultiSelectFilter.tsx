/**
 * MultiSelectFilter Component
 *
 * A filter component with a popover for multi-select options with checkboxes.
 * Inspired by the cargoplan ListSelector component.
 *
 * Features:
 * - Multi-select with checkboxes
 * - Colored badges for each option
 * - "Select all" functionality
 * - Clear button to reset selection
 * - Shows count when multiple selected, badge when single selected
 */

import React, { useCallback, useMemo } from "react";
import { Minus } from "lucide-react";
import { Popover } from "./Popover";
import { cn } from "@/utils";

/**
 * Option item for the filter
 */
import { Badge } from "./Badge";
import { Icon, type IconName } from "./Icon";

/**
 * Option item for the filter
 */
export interface FilterOption {
  id: string;
  label: string;
  /** Badge color variant */
  color?: string;
}

/**
 * Props for the MultiSelectFilter component
 */
export interface MultiSelectFilterProps {
  /** Label for the filter trigger button */
  label: string;
  /** Available options to select from */
  options: FilterOption[];
  /** Currently selected option IDs */
  selectedIds: string[];
  /** Callback when selection changes */
  onChange: (selectedIds: string[]) => void;
  /** Placeholder when nothing is selected */
  placeholder?: string;
  /** Whether to show the select all option */
  showSelectAll?: boolean;
  /** Label for select all (default: "Tout sélectionner") */
  selectAllLabel?: string;
  /** Custom className for the trigger button */
  className?: string;
  /** Optional icon to display before the label */
  icon?: IconName;
}

/**
 * ListItem - Individual option in the filter list
 */
const ListItem: React.FC<{
  option: FilterOption;
  isSelected: boolean;
  onToggle: () => void;
}> = ({ option, isSelected, onToggle }) => {
  return (
    <label
      className={cn(
        "group flex items-center px-4 py-2.5 cursor-pointer transition-all duration-150",
        "hover:bg-gray-50/80",
        isSelected && "bg-sky-50/30"
      )}
    >
      {/* Checkbox */}
      <div className="flex-shrink-0 mr-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          className="sr-only"
        />
        {isSelected ? (
          <div className="w-5 h-5 rounded-md flex items-center justify-center bg-sky-500 transition-all duration-150">
            <Icon name="check" className="w-3.5 h-3.5 text-white" />
          </div>
        ) : (
          <div className="w-5 h-5 rounded-md border-2 border-gray-300 group-hover:border-gray-400 transition-all duration-150" />
        )}
      </div>

      {/* Badge */}
      <Badge variant={option.color || "default"} size="sm">
        {option.label.toUpperCase()}
      </Badge>
    </label>
  );
};

/**
 * MultiSelectFilter Component
 */
export const MultiSelectFilter: React.FC<MultiSelectFilterProps> = ({
  label,
  options,
  selectedIds,
  onChange,
  placeholder,
  showSelectAll = true,
  selectAllLabel = "Select all",
  className = "",
  icon,
}) => {
  // Check if all options are selected
  const allSelected = useMemo(
    () => options.length > 0 && selectedIds.length === options.length,
    [options.length, selectedIds.length]
  );

  // Check if some but not all options are selected
  const someSelected = useMemo(
    () => selectedIds.length > 0 && selectedIds.length < options.length,
    [options.length, selectedIds.length]
  );

  // Handle toggling a single option
  const handleToggle = useCallback(
    (id: string) => {
      const newSelected = selectedIds.includes(id)
        ? selectedIds.filter((selectedId) => selectedId !== id)
        : [...selectedIds, id];
      onChange(newSelected);
    },
    [selectedIds, onChange]
  );

  // Handle select all / deselect all
  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      onChange([]);
    } else {
      onChange(options.map((opt) => opt.id));
    }
  }, [allSelected, options, onChange]);

  // Handle clearing selection
  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange([]);
    },
    [onChange]
  );

  // Get single selected option for display
  const singleSelectedOption = useMemo(() => {
    if (selectedIds.length === 1) {
      return options.find((opt) => opt.id === selectedIds[0]);
    }
    return null;
  }, [selectedIds, options]);

  // Render the trigger content
  const renderTriggerContent = () => {
    if (selectedIds.length === 0) {
      return (
        <span className="text-gray-500">{placeholder || `Select ${label}...`}</span>
      );
    }

    if (singleSelectedOption) {
      // Show badge for single selection
      return <Badge variant={singleSelectedOption.color || "default"} size="xs">{singleSelectedOption.label.toUpperCase()}</Badge>;
    }

    // Show count for multiple selections
    return (
      <span className="flex items-center gap-1.5">
        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-sky-500 text-white text-xs font-medium">
          {selectedIds.length}
        </span>
        <span className="text-gray-700">selected</span>
      </span>
    );
  };

  return (
    <Popover
      placement="bottom-start"
      showBackdrop={false}
      trigger={({ isOpen }) => (
        <div
          className={cn(
            "inline-flex items-center gap-2 px-3 py-1.5 bg-white border rounded cursor-pointer transition-colors w-[240px] h-[34px]",
            isOpen
              ? "border-sky-500 ring-2 ring-sky-500/20"
              : "border-gray-300 hover:border-gray-400",
            className
          )}
        >
          {/* Icon */}
          {icon && <Icon name={icon} className="w-4 h-4 text-gray-400" />}

          {/* Content */}
          <div className="flex-1 text-xs truncate ml-1">{renderTriggerContent()}</div>

          {/* Chevron */}
          <Icon
            name="chevron-down"
            className={cn(
              "w-4 h-4 text-gray-400 transition-transform",
              isOpen && "rotate-180"
            )}
          />

          {/* Clear button */}
          {selectedIds.length > 0 && (
            <button
              onClick={handleClear}
              className="p-0.5 -mr-1 hover:bg-gray-100 rounded transition-colors flex items-center justify-center cursor-pointer"
            >
              <Icon name="close" className="w-4 h-4 text-gray-400 hover:text-gray-600" />
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
            {options.map((option) => (
              <ListItem
                key={option.id}
                option={option}
                isSelected={selectedIds.includes(option.id)}
                onToggle={() => handleToggle(option.id)}
              />
            ))}
          </div>

          {/* Select all footer */}
          {showSelectAll && options.length > 0 && (
            <div className="border-t border-gray-100 mt-1 px-4 py-2.5">
              <label className="flex items-center w-full cursor-pointer group">
                <div className="flex-shrink-0 mr-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    className="sr-only"
                  />
                  {allSelected || someSelected ? (
                    <div className="w-5 h-5 rounded-md flex items-center justify-center bg-sky-500 transition-all duration-150">
                      {allSelected ? (
                        <Icon name="check" className="w-3.5 h-3.5 text-white" />
                      ) : (
                        <Minus className="w-3.5 h-3.5 text-white" />
                      )}
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-md border-2 border-gray-300 group-hover:border-gray-400 transition-all duration-150" />
                  )}
                </div>
                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">
                  {selectAllLabel}
                </span>
              </label>
            </div>
          )}
        </div>
      )}
    </Popover>
  );
};
