/**
 * Memoized result-entry card so sibling cards skip re-render while one field is edited.
 */

import { memo, useCallback } from 'react';
import type { Test } from '@/types';
import type { TestWithContextResult } from '../types';
import { ResultEntryCard } from '../workflow';
import { orderTestKey } from '../utils/labSearchAndLinks';

export interface ResultEntryQueueItemProps {
  test: TestWithContextResult;
  idx: number;
  testDef: Test | undefined;
  results: Record<string, string>;
  technicianNotes: string;
  isComplete: boolean;
  isMobile: boolean;
  onResultsChange: (resultKey: string, paramCode: string, value: string) => void;
  onNotesChange: (resultKey: string, notes: string) => void;
  onSaveTest: (test: TestWithContextResult) => void;
  onOpenTest: (test: TestWithContextResult) => void;
}

export const ResultEntryQueueItem = memo(
  ({
    test,
    idx,
    testDef,
    results,
    technicianNotes,
    isComplete,
    isMobile,
    onResultsChange,
    onNotesChange,
    onSaveTest,
    onOpenTest,
  }: ResultEntryQueueItemProps) => {
    const resultKey = orderTestKey(test.id!);
    const handleSave = useCallback(() => onSaveTest(test), [onSaveTest, test]);
    const handleClick = useCallback(() => onOpenTest(test), [onOpenTest, test]);

    return (
      <ResultEntryCard
        key={`entry-${test.id}-${idx}`}
        test={test}
        testDef={testDef}
        resultKey={resultKey}
        results={results}
        technicianNotes={technicianNotes}
        isComplete={isComplete}
        onResultsChange={onResultsChange}
        onNotesChange={onNotesChange}
        onSave={handleSave}
        onClick={handleClick}
        isMobile={isMobile}
      />
    );
  }
);
ResultEntryQueueItem.displayName = 'ResultEntryQueueItem';
