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
import React, { useMemo, useRef, useState } from 'react';
import { EMPTY_COPY } from '@/components/display';
import { RemovableTag, CheckboxIndicator } from '@/components/primitives';
import type { TestSummary } from '@/types';
import { indexTestsByCode } from '@/features/catalog/testLookup';
import { getCategoryLabel } from '@/features/catalog/constants/catalogConfig';
import { cn, formatCurrency, formatTurnaroundTime, titleCaseWords } from '@/utils';
import { IconKeys } from '@/config/icons';
import { text, FG } from '@/theme/recipes';
import { SearchResultsPopoverShell } from '@/components/overlays/SearchResultsPopoverShell';
import {
  SearchTagInputChrome,
  SELECTED_SEARCH_CHIP_CLASS,
} from '@/components/overlays/SearchTagInputChrome';
import { CONTROL } from '@/theme/recipes';
import { useAnchoredPopoverDismiss } from '@/hooks';

function TestSelectMetaLine({ code, test }: { code: string; test: TestSummary }) {
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
    <p className={`${text({ role: 'caption' })} font-normal truncate uppercase min-w-0`}>
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
  test?: TestSummary;
}) {
  return (
    <div className="min-w-0 flex flex-col">
      <span className={`${text({ role: 'body' })} font-normal truncate`}>{name}</span>
      {test ? (
        <TestSelectMetaLine code={code} test={test} />
      ) : (
        <p className={`${text({ role: 'caption' })} font-normal truncate uppercase`}>{code}</p>
      )}
    </div>
  );
}

interface TestSelectorProps {
  selectedTests: string[];
  testSearch: string;
  onTestSearchChange: (value: string) => void;
  filteredTests: TestSummary[];
  onToggleTest: (testCode: string) => void;
  error?: string;
  /** Slim catalog for looking up names and prices by code */
  tests?: TestSummary[];
}

/**
 * TestSearchTagInput
 *
 * Selected tests are shown as removable tags inside the input box, while the
 * input text remains controlled by the parent (used to drive the results list).
 * Tags match the patient tag styling (bg-brand-muted, border-border-default) but without avatars.
 */
const TestSearchTagInput: React.FC<{
  selectedTags: Array<{ code: string; name: string; test?: TestSummary }>;
  selectedCount: number;
  value: string;
  onValueChange: (value: string) => void;
  onRemoveTag: (code: string) => void;
  error?: string;
}> = ({ selectedTags, selectedCount, value, onValueChange, onRemoveTag, error }) => (
  <SearchTagInputChrome
    label="Tests"
    htmlFor="order-test-search"
    iconKey={IconKeys.dataFields.document}
    error={error}
    labelTrailing={
      <span className={`${text({ role: 'amount' })} ${FG.captionMuted} tabular-nums shrink-0`}>
        {selectedCount} {selectedCount === 1 ? 'test' : 'tests'}
      </span>
    }
  >
    {selectedTags.map(({ code, name, test }, idx) => (
      <RemovableTag
        key={`${code}-${idx}`}
        size="xs"
        onRemove={() => onRemoveTag(code)}
        removeAriaLabel={`Remove ${code}`}
        className={SELECTED_SEARCH_CHIP_CLASS}
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
      className={`flex-1 min-w-[120px] outline-none ${text({ role: 'body' })} placeholder:${FG.muted} bg-transparent leading-normal`}
      autoComplete="off"
    />
  </SearchTagInputChrome>
);

interface TestSelectPopoverProps {
  visibleTests: TestSummary[];
  selectedSet: Set<string>;
  onToggleTest: (testCode: string) => void;
}

const TestSelectPopover: React.FC<TestSelectPopoverProps> = ({
  visibleTests,
  selectedSet,
  onToggleTest,
}) => (
  <SearchResultsPopoverShell
    title="Matching tests"
    resultCount={visibleTests.length}
    emptyMessage={EMPTY_COPY.matchingTests.title}
    emptyDescription={EMPTY_COPY.matchingTests.description}
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
                  'transition-colors cursor-pointer',
                  'flex items-center gap-space-2',
                  'hover:bg-surface-page',
                  CONTROL.focusVisibleTight,
                  isSelected ? 'bg-surface-page' : 'bg-surface',
                  'group'
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className={`${text({ role: 'body' })} font-normal truncate`}>{safeName}</p>
                  <TestSelectMetaLine code={code} test={test} />
                </div>
                <div className="flex shrink-0 items-center gap-layout-section">
                  <span className={`${text({ role: 'amount' })} font-medium ${FG.captionMuted} tabular-nums`}>
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
  </SearchResultsPopoverShell>
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
  useAnchoredPopoverDismiss(containerRef, setIsPopoverOpen);

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

  // Build tags with test details (code and name) for display inside the input.
  // Matches patient tag styling but without avatar.
  const catalogIndex = useMemo(() => indexTestsByCode(tests), [tests]);
  const selectedTags = useMemo(() => {
    return selectedTests
      .filter(code => typeof code === 'string' && code.trim().length > 0)
      .map(code => {
        const test = catalogIndex.get(code);
        return {
          code,
          name: test?.name || code,
          test,
        };
      });
  }, [selectedTests, catalogIndex]);

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
