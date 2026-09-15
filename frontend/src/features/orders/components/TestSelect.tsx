/**
 * TestSelect
 *
 * Test selection control for order creation.
 *
 * UX requirement:
 * - Tests are NOT selected in a modal.
 * - Selecting happens via a simple "popover" list shown directly under the search input.
 * - Each list row shows: `code - name - price` and a payment-style check circle on the right.
 * - The popover stays open while selecting; outside click closes only when every visible test is checked.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Icon, RemovableTag, TagChip } from '@/components';
import type { Test } from '@/types';
import { cn, formatCurrency } from '@/utils';
import { ICONS } from '@/config/icons';
import { inputContainerBase, inputContainerError } from '@/components/inputs/inputStyles';

interface TestSelectorProps {
  selectedTests: string[];
  testSearch: string;
  onTestSearchChange: (value: string) => void;
  filteredTests: Test[];
  onToggleTest: (testCode: string) => void;
  error?: string;
  /** Full test catalog for looking up test details by code */
  tests?: Test[];
}

/** Circular check indicator matching PaymentMethodSelector. */
const SelectionCheck: React.FC<{ isSelected: boolean }> = ({ isSelected }) => (
  <div
    className={cn(
      'w-5 h-5 rounded-full flex items-center justify-center transition-colors duration-200 shrink-0',
      isSelected ? 'bg-brand' : 'bg-transparent border-2 border-border-strong'
    )}
  >
    {isSelected && <Icon name={ICONS.actions.check} className="w-3 h-3 text-on-brand" />}
  </div>
);

/**
 * TestSearchTagInput
 *
 * Selected tests are shown as removable tags inside the input box, while the
 * input text remains controlled by the parent (used to drive the results list).
 * Tags match the patient tag styling (bg-brand-muted, border-border-default) but without avatars.
 */
const TestSearchTagInput: React.FC<{
  selectedTags: Array<{ code: string; name: string }>;
  value: string;
  onValueChange: (value: string) => void;
  onRemoveTag: (code: string) => void;
  error?: string;
}> = ({ selectedTags, value, onValueChange, onRemoveTag, error }) => (
  <div className="w-full">
      <div className="flex justify-between items-baseline mb-1 gap-2">
        <label
          htmlFor="order-test-search"
          className="text-xs font-normal text-text-tertiary cursor-pointer truncate min-w-0"
        >
          Tests
        </label>
      </div>

      <div
        className={cn(
          inputContainerBase,
          'group relative pl-10 pr-3 py-2.5 flex flex-wrap gap-2 items-center min-h-[42px]',
          error && inputContainerError
        )}
      >
        <div className="absolute inset-y-0 left-0 pl-3 flex items-start pt-2.5 pointer-events-none">
          <Icon
            name={ICONS.dataFields.document}
            className="w-4 h-4 text-text-muted group-hover:text-brand transition-colors"
          />
        </div>

        {selectedTags.map(({ code, name }, idx) => (
          <RemovableTag
            key={`${code}-${idx}`}
            size="sm"
            onRemove={() => onRemoveTag(code)}
            removeAriaLabel={`Remove ${code}`}
          >
            <span className="min-w-0 truncate text-xs font-normal">{name}</span>
            <span className="entity-id shrink-0">{code}</span>
          </RemovableTag>
        ))}

        <input
          id="order-test-search"
          name="testSearch"
          type="text"
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onValueChange(e.target.value)}
          onFocus={() => onValueChange(value)}
          placeholder={selectedTags.length === 0 ? 'Search by code or name…' : ''}
          className="flex-1 min-w-[120px] outline-none text-xs text-text-primary placeholder:text-text-muted bg-transparent leading-normal"
          autoComplete="off"
        />
      </div>

      {error && <p className="mt-1.5 text-xs text-danger-fg">{error}</p>}
    </div>
  );

interface TestSelectPopoverProps {
  visibleTests: Test[];
  selectedSet: Set<string>;
  onToggleTest: (testCode: string) => void;
}

const TestSelectPopover: React.FC<TestSelectPopoverProps> = ({
  visibleTests,
  selectedSet,
  onToggleTest,
}) => (
  <div
    className={[
      'mt-1 text-text-primary',
      'border border-border-default/80',
      'rounded',
      'overflow-hidden',
      'bg-surface',
      'shadow-md',
      'ring-1 ring-black/5',
    ].join(' ')}
  >
    <div className="px-4 py-2.5 bg-surface-page/70 border-b border-border-default/70 flex items-center justify-between">
      <div className="text-xs font-normal text-text-tertiary">Matching tests</div>
      <div className="text-xs text-text-tertiary">{visibleTests.length} result(s)</div>
    </div>

    {visibleTests.length === 0 ? (
      <div className="px-4 py-3 text-xs text-text-tertiary">No tests found</div>
    ) : (
      <div className="max-h-[320px] overflow-y-auto divide-y divide-border-subtle">
        {visibleTests.map(test => {
          const code = typeof test.code === 'string' ? test.code : String(test.code);
          const isSelected = selectedSet.has(code);
          const safeName = typeof test.name === 'string' ? test.name : String(test.name);
          const price = typeof test.price === 'number' ? test.price : Number(test.price) || 0;

          return (
            <button
              key={code}
              type="button"
              onClick={() => onToggleTest(code)}
              className={[
                'w-full text-left px-4 py-3 text-text-primary',
                'transition-colors',
                'flex items-center justify-between gap-4',
                'hover:bg-surface-hover',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-opacity-30 focus-visible:bg-surface-hover',
                'bg-surface',
              ].join(' ')}
            >
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                  <TagChip size="xs" emphasis="code" className="entity-id shrink-0">
                    {code}
                  </TagChip>
                  <span className="min-w-0 truncate text-xs font-normal text-text-primary">
                    {safeName}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-3">
                <TagChip size="sm" emphasis="code">
                  {formatCurrency(price)}
                </TagChip>
                <SelectionCheck isSelected={isSelected} />
              </div>
            </button>
          );
        })}
      </div>
    )}
  </div>
);

export const TestSelect: React.FC<TestSelectorProps> = ({
  selectedTests,
  testSearch,
  onTestSearchChange,
  filteredTests,
  onToggleTest,
  error,
  tests = [],
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  /**
   * Defensive: normalize selected tests to a set for fast membership checks.
   * Also guards against unexpected non-string values.
   */
  const selectedSet = useMemo(() => {
    const set = new Set<string>();
    for (const code of selectedTests) {
      if (typeof code === 'string' && code.trim().length > 0) set.add(code);
    }
    return set;
  }, [selectedTests]);

  const hasSearch = testSearch.trim().length > 0;
  const visibleTests = useMemo(
    () => (hasSearch ? filteredTests : []),
    [hasSearch, filteredTests]
  );

  const visibleTestsRef = useRef(visibleTests);
  const selectedSetRef = useRef(selectedSet);
  useEffect(() => {
    visibleTestsRef.current = visibleTests;
    selectedSetRef.current = selectedSet;
  }, [visibleTests, selectedSet]);

  const canClosePopover = () => {
    const tests = visibleTestsRef.current;
    if (tests.length === 0) return true;
    return tests.every(test => {
      const code = typeof test.code === 'string' ? test.code : String(test.code);
      return selectedSetRef.current.has(code);
    });
  };

  // Close popover on outside click only when every visible test is selected; Escape always closes.
  useEffect(() => {
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      const container = containerRef.current;
      if (!container || !target) return;
      if (!container.contains(target) && canClosePopover()) setIsPopoverOpen(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsPopoverOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown, { passive: true });
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Build tags with test details (code and name) for display inside the input.
  // Matches patient tag styling but without avatar.
  const selectedTags = useMemo(() => {
    return selectedTests
      .filter(code => typeof code === 'string' && code.trim().length > 0)
      .map(code => {
        const test = tests.find(t => t.code === code);
        return {
          code,
          name: test?.name || code,
        };
      });
  }, [selectedTests, tests]);

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-end gap-3">
        <div className="grow min-w-0">
          {/* Tag-style input (similar to patient medical background TagInput) */}
          <TestSearchTagInput
            selectedTags={selectedTags}
            value={testSearch}
            onValueChange={value => {
              onTestSearchChange(value);
              setIsPopoverOpen(value.trim().length > 0);
            }}
            onRemoveTag={onToggleTest}
            error={error}
          />
        </div>

        <div className="shrink-0 pb-[2px]">
          <div className="text-base font-normal text-brand">
            {selectedTests.length} {selectedTests.length === 1 ? 'test' : 'tests'}
          </div>
        </div>
      </div>

      {/* "Popover" results shown directly under the input */}
      {isPopoverOpen && hasSearch && (
        <TestSelectPopover
          visibleTests={visibleTests}
          selectedSet={selectedSet}
          onToggleTest={onToggleTest}
        />
      )}
    </div>
  );
};
