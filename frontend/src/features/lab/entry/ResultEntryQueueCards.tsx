/**
 * Memoized result-entry card so sibling cards skip re-render while one field is edited.
 */

import { memo, useCallback } from 'react';
import type { Test } from '@/types';
import type { EntryQueueRow } from '../types/entryQueue';
import { ResultEntryCard } from '../workflow';
import { orderTestKey } from '../utils/labSearchAndLinks';

export interface ResultEntryQueueItemProps {
  row: EntryQueueRow;
  idx: number;
  testDef: Test | undefined;
  results: Record<string, string>;
  technicianNotes: string;
  isComplete: boolean;
  isMobile: boolean;
  onResultsChange: (resultKey: string, paramCode: string, value: string) => void;
  onNotesChange: (resultKey: string, notes: string) => void;
  onSaveRow: (row: EntryQueueRow) => void;
  onOpenRow: (row: EntryQueueRow) => void;
}

export const ResultEntryQueueItem = memo(
  ({
    row,
    idx,
    testDef,
    results,
    technicianNotes,
    isComplete,
    isMobile,
    onResultsChange,
    onNotesChange,
    onSaveRow,
    onOpenRow,
  }: ResultEntryQueueItemProps) => {
    const resultKey = orderTestKey(row.orderTestId);
    const handleSave = useCallback(() => onSaveRow(row), [onSaveRow, row]);
    const handleClick = useCallback(() => onOpenRow(row), [onOpenRow, row]);

    return (
      <ResultEntryCard
        key={`entry-${row.orderTestId}-${idx}`}
        row={row}
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
