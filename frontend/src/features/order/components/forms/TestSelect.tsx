/**
 * TestSelect
 *
 * Test selection control for order creation.
 *
 * UX requirement:
 * - Tests are NOT selected in a modal.
 * - Selecting happens via a simple "popover" list shown directly under the search input.
 * - Each list row shows: `code - name - price` and a green check icon when already selected.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Icon } from '@/shared/ui';
import { formatCurrency } from '@/utils';
import type { Test } from '@/types';

interface TestSelectorProps {
  selectedTests: string[];
  testSearch: string;
  onTestSearchChange: (value: string) => void;
  filteredTests: Test[];
  onToggleTest: (testCode: string) => void;
  totalPrice: number;
  error?: string;
}

/**
 * TestSearchTagInput
 *
 * Selected tests are shown as removable tags inside the input box, while the
 * input text remains controlled by the parent (used to drive the results list).
 */
const TestSearchTagInput: React.FC<{
  selectedTags: string[];
  value: string;
  onValueChange: (value: string) => void;
  onRemoveTag: (code: string) => void;
  error?: string;
}> = ({ selectedTags, value, onValueChange, onRemoveTag, error }) => {
  return (
    <div className="w-full">
      <div className="flex justify-between items-baseline mb-1 gap-2">
        <label
          htmlFor="order-test-search"
          className="text-xs font-medium text-gray-500 cursor-pointer truncate min-w-0"
        >
          Tests
        </label>
      </div>

      <div
        className={[
          'relative',
          'w-full pl-10 pr-3 py-2.5 border rounded',
          'bg-white transition-colors',
          'focus-within:ring-2 focus-within:ring-sky-500 focus-within:border-transparent',
          error ? 'border-red-500' : 'border-gray-300',
          'flex flex-wrap gap-2 items-center',
          'min-h-[42px]',
        ].join(' ')}
      >
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon name="document" className="w-4 h-4 text-gray-400" />
        </div>

        {selectedTags.map(code => (
          <Badge
            key={code}
            variant="primary"
            size="sm"
            className="flex items-center gap-1.5 px-2 py-0.5 h-6"
          >
            <span className="text-xs font-medium leading-tight font-mono">{code}</span>
            <button
              type="button"
              onClick={() => onRemoveTag(code)}
              className="flex items-center justify-center ml-0.5 -mr-0.5 hover:bg-black/10 rounded-full p-0.5 transition-colors focus:outline-none focus:ring-1 focus:ring-gray-400"
              aria-label={`Remove ${code}`}
            >
              <Icon name="close-circle" className="w-3 h-3 text-gray-500 hover:text-gray-700" />
            </button>
          </Badge>
        ))}

        <input
          id="order-test-search"
          name="testSearch"
          type="text"
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onValueChange(e.target.value)}
          onFocus={() => onValueChange(value)}
          placeholder={selectedTags.length === 0 ? 'Search by code or name…' : ''}
          className="flex-1 min-w-[120px] outline-none text-xs text-gray-900 placeholder:text-gray-300 bg-transparent leading-normal"
          autoComplete="off"
        />
      </div>

      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
};

export const TestSelect: React.FC<TestSelectorProps> = ({
  selectedTests,
  testSearch,
  onTestSearchChange,
  filteredTests,
  onToggleTest,
  totalPrice,
  error,
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
  const visibleTests = hasSearch ? filteredTests : [];

  // Close popover on outside click and Escape.
  useEffect(() => {
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      const container = containerRef.current;
      if (!container || !target) return;
      if (!container.contains(target)) setIsPopoverOpen(false);
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

  // Build tags for display inside the input.
  // We render the test codes as tags (consistent "ID" representation).
  const selectedTags = useMemo(
    () => selectedTests.filter(code => typeof code === 'string' && code.trim().length > 0),
    [selectedTests]
  );

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
          <div className="h-[34px] inline-flex items-center px-3 rounded-md border border-sky-100 bg-sky-50 text-sky-700 text-xs font-semibold">
            Total: {formatCurrency(totalPrice)}
          </div>
        </div>
      </div>

      {/* "Popover" results shown directly under the input */}
      {isPopoverOpen && hasSearch && (
        <div
          className={[
            'mt-1',
            'border border-gray-200/80',
            'rounded-xl',
            'overflow-hidden',
            'bg-white',
            'shadow-lg shadow-gray-900/10',
            'ring-1 ring-black/5',
          ].join(' ')}
        >
          {/* Header row */}
          <div className="px-4 py-2.5 bg-gray-50/70 border-b border-gray-200/70 flex items-center justify-between">
            <div className="text-xs font-medium text-gray-600">Matching tests</div>
            <div className="text-xs text-gray-500">{visibleTests.length} result(s)</div>
          </div>

          {visibleTests.length === 0 ? (
            <div className="px-4 py-3 text-xs text-gray-500">No tests found</div>
          ) : (
            <div className="max-h-[320px] overflow-y-auto divide-y divide-gray-100">
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
                      'w-full text-left px-4 py-3',
                      'transition-colors',
                      'flex items-center justify-between gap-4',
                      'hover:bg-sky-50/40',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/30 focus-visible:bg-sky-50/40',
                      isSelected ? 'bg-emerald-50/30' : 'bg-white',
                    ].join(' ')}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="shrink-0 text-xs font-semibold font-mono px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 border border-gray-200">
                          {code}
                        </span>
                        <span className="text-xs font-medium text-gray-900 truncate">
                          {safeName}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <div className="text-xs font-semibold px-2 py-1 rounded-md bg-sky-50 text-sky-700 border border-sky-100">
                        {formatCurrency(price)}
                      </div>
                      {isSelected && (
                        <Icon name="check-circle" className="w-5 h-5 text-emerald-600" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
