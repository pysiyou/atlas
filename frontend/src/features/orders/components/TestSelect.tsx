/**
 * TestSelect
 *
 * Test selection control for order creation.
 *
 * UX requirement:
 * - Tests are NOT selected in a modal.
 * - Selecting happens via a simple "popover" list shown directly under the search input.
 * - Each list row shows test details and a square checkbox on the right (multi-select).
 * - The popover stays open while selecting; outside click or Escape closes it.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Icon, RemovableTag, CheckboxIndicator } from '@/components';
import type { Test } from '@/types';
import { getCategoryLabel } from '@/features/catalog/constants/catalogConfig';
import { cn, formatCurrency, formatTurnaroundTime, titleCaseWords } from '@/utils';
import { ICONS } from '@/config/icons';
import { inputContainerBase, inputContainerError, FORM_CONTROL_LABEL } from '@/components/inputs/inputStyles';
import { OrderSelectPopoverShell } from './OrderSelectPopoverShell';
import { CONTROL, SPACING, TONE, TYPE } from '@/components/theme/recipes';


const SELECTED_CHIP_CLASS =
  'max-w-[min(100%,20rem)] items-start gap-space-2 py-space-1-5 px-space-2 bg-surface-page border-border-default/80 shadow-none';

function TestSelectMetaLine({ code, test }: { code: string; test: Test }) {
  const segments: Array<{ id: string; label: string }> = [];

  if (test.category) {
    const slug = String(test.category).toLowerCase();
    segments.push({ id: 'category', label: getCategoryLabel(slug) });
  }
  if (test.sampleType) {
    const slug = String(test.sampleType).toLowerCase();
    segments.push({
      id: 'sampleType',
      label: titleCaseWords(slug.replace(/_/g, ' ')),
    });
  }
  const hours = test.turnaroundTime;
  if (typeof hours === 'number' && Number.isFinite(hours) && hours > 0) {
    segments.push({ id: 'tat', label: formatTurnaroundTime(hours) });
  }
  if (test.fastingRequired) {
    segments.push({ id: 'fasting', label: 'Fasting' });
  }

  const hasCode = code.trim().length > 0;
  if (!hasCode && segments.length === 0) return null;

  return (
    <p className="text-xxs font-normal truncate uppercase min-w-0 text-text-tertiary">
      {hasCode && <span className="truncate">{code}</span>}
      {hasCode && segments.length > 0 && <span> · </span>}
      {segments.map((segment, index) => (
        <React.Fragment key={segment.id}>
          {index > 0 && <span> · </span>}
          <span>{segment.label}</span>
        </React.Fragment>
      ))}
    </p>
  );
}

function TestSelectedChip({
  code,
  name,
  test,
}: {
  code: string;
  name: string;
  test?: Test;
}) {
  return (
    <div className="min-w-0 flex flex-col">
      <span className={`${TYPE.value} font-normal truncate`}>{name}</span>
      {test ? (
        <TestSelectMetaLine code={code} test={test} />
      ) : (
        <p className="text-xxs font-normal text-text-tertiary truncate uppercase">{code}</p>
      )}
    </div>
  );
}

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

/**
 * TestSearchTagInput
 *
 * Selected tests are shown as removable tags inside the input box, while the
 * input text remains controlled by the parent (used to drive the results list).
 * Tags match the patient tag styling (bg-brand-muted, border-border-default) but without avatars.
 */
const TestSearchTagInput: React.FC<{
  selectedTags: Array<{ code: string; name: string; test?: Test }>;
  selectedCount: number;
  value: string;
  onValueChange: (value: string) => void;
  onRemoveTag: (code: string) => void;
  error?: string;
}> = ({ selectedTags, selectedCount, value, onValueChange, onRemoveTag, error }) => (
  <div className="w-full">
      <div className="flex justify-between items-baseline mb-space-1 gap-space-2">
        <label
          htmlFor="order-test-search"
          className={FORM_CONTROL_LABEL}
        >
          Tests
        </label>
        <span className="text-sm font-normal text-text-tertiary tabular-nums shrink-0">
          {selectedCount} {selectedCount === 1 ? 'test' : 'tests'}
        </span>
      </div>

      <div
        className={cn(
          inputContainerBase,
          `group relative ${SPACING.plSpace10} pr-space-3 py-space-2-5 flex flex-wrap gap-space-2 items-center ${CONTROL.heightMultiline}`,
          error && inputContainerError
        )}
      >
        <div className="absolute inset-y-0 left-0 pl-space-3 flex items-start pt-space-2.5 pointer-events-none">
          <Icon
            name={ICONS.dataFields.document}
            className="w-4 h-4 text-text-muted group-hover:text-brand transition-colors"
          />
        </div>

        {selectedTags.map(({ code, name, test }, idx) => (
          <RemovableTag
            key={`${code}-${idx}`}
            size="xs"
            onRemove={() => onRemoveTag(code)}
            removeAriaLabel={`Remove ${code}`}
            className={SELECTED_CHIP_CLASS}
          >
            <TestSelectedChip code={code} name={name} test={test} />
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
          className={`flex-1 min-w-[120px] outline-none ${TYPE.value} placeholder:text-text-muted bg-transparent leading-normal`}
          autoComplete="off"
        />
      </div>

      {error && <p className={`mt-space-1-5 text-xs ${TONE.danger.fg}`}>{error}</p>}
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
  <OrderSelectPopoverShell
    title="Matching tests"
    resultCount={visibleTests.length}
    emptyMessage="No tests found"
    isEmpty={visibleTests.length === 0}
  >
    {visibleTests.map(test => {
            const code = typeof test.code === 'string' ? test.code : String(test.code);
            const isSelected = selectedSet.has(code);
            const safeName = typeof test.name === 'string' ? test.name : String(test.name);
            const price = typeof test.price === 'number' ? test.price : Number(test.price) || 0;
            return (
              <button
                key={code}
                type="button"
                role="checkbox"
                aria-checked={isSelected}
                aria-label={`${isSelected ? 'Deselect' : 'Select'} ${safeName}`}
                onClick={() => onToggleTest(code)}
                className={cn(
                  'w-full text-left px-space-3 py-space-2',
                  'transition-colors',
                  'flex items-center gap-space-2',
                  'hover:bg-surface-page',
                  CONTROL.focusVisibleTight,
                  isSelected ? 'bg-surface-page' : 'bg-surface',
                  'group'
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className={`${TYPE.value} font-normal truncate`}>{safeName}</p>
                  <TestSelectMetaLine code={code} test={test} />
                </div>
                <div className="flex shrink-0 items-center gap-layout-section">
                  <span className="text-sm font-medium text-text-tertiary tabular-nums">
                    {formatCurrency(price)}
                  </span>
                  <CheckboxIndicator
                    checked={isSelected}
                    className={!isSelected ? 'group-hover:border-brand' : undefined}
                  />
                </div>
              </button>
            );
    })}
  </OrderSelectPopoverShell>
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
          test,
        };
      });
  }, [selectedTests, tests]);

  return (
    <div ref={containerRef} className="relative">
      <TestSearchTagInput
        selectedTags={selectedTags}
        selectedCount={selectedTests.length}
        value={testSearch}
        onValueChange={value => {
          onTestSearchChange(value);
          setIsPopoverOpen(value.trim().length > 0);
        }}
        onRemoveTag={onToggleTest}
        error={error}
      />

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
