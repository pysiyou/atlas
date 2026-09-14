/**
 * EntryCard hooks - shared data derivation for mobile/desktop variants
 */

import { useMemo } from 'react';
import { usePatientNameLookup } from '@/features/patients';
import { useLabCardClickGuard, useTestWorkItemState } from '@/features/lab/hooks';
import { deriveRetestContext } from '../../utils/deriveRetestContext';
import type { Test, TestWithContext } from '@/types';

export interface EntryCardProps {
  test: TestWithContext;
  testDef: Test | undefined;
  resultKey: string;
  results: Record<string, string>;
  technicianNotes: string;
  isComplete: boolean;
  onResultsChange: (resultKey: string, paramCode: string, value: string) => void;
  onNotesChange: (resultKey: string, notes: string) => void;
  onSave: () => void;
  onClick: () => void;
  isMobile?: boolean;
}

export interface EntryCardSharedData {
  test: TestWithContext;
  testDef: Test;
  results: Record<string, string>;
  isComplete: boolean;
  patientName: string;
  parameterCount: number;
  filledCount: number;
  handleCardClick: (e?: React.MouseEvent) => void;
  workItem: ReturnType<typeof useTestWorkItemState>;
  rejection: ReturnType<typeof deriveRetestContext>;
}

export function useEntryCardData(props: EntryCardProps): EntryCardSharedData | null {
  const { test, testDef, results, isComplete, onClick } = props;
  const { getPatientName } = usePatientNameLookup();
  const handleCardClick = useLabCardClickGuard(onClick);
  const workItem = useTestWorkItemState(test);
  const rejection = useMemo(() => deriveRetestContext(test), [test]);

  if (!testDef?.parameters) return null;

  const patientName = getPatientName(test.patientId);
  const parameterCount = testDef.parameters.length;
  const filledCount = Object.values(results).filter(v => v?.trim()).length;

  return {
    test,
    testDef,
    results,
    isComplete,
    patientName,
    parameterCount,
    filledCount,
    handleCardClick,
    workItem,
    rejection,
  };
}
