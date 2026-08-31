import { useCallback } from 'react';
import { useTestNameLookup } from '@/features/catalog';
import { useModal, ModalType } from '@/lib/context/ModalContext';
import type { TestWithContext, Test, Order } from '@/types';

interface UseEntryTestModalOptions {
  testCatalog: Test[] | undefined;
  orders: Order[] | undefined;
  allTests: TestWithContext[];
  results: Record<string, Record<string, string>>;
  technicianNotes: Record<string, string>;
  areAllParametersFilled: (resultKey: string, parameterCount: number) => boolean;
  handleResultChange: (resultKey: string, paramCode: string, value: string) => void;
  handleNotesChange: (resultKey: string, notes: string) => void;
  handleSaveResults: (
    orderId: number | string,
    testCode: string,
    allTests: TestWithContext[],
    testCatalog: Test[] | undefined,
    orders: Order[] | undefined,
    finalResults?: Record<string, string>,
    finalNotes?: string
  ) => Promise<void>;
}

export function useEntryTestModal({
  testCatalog,
  orders,
  allTests,
  results,
  technicianNotes,
  areAllParametersFilled,
  handleResultChange,
  handleNotesChange,
  handleSaveResults,
}: UseEntryTestModalOptions) {
  const { getTest } = useTestNameLookup();
  const { openModal } = useModal();

  const openTestModal = useCallback(
    (test: TestWithContext) => {
      if (!testCatalog) return;

      const testDef = getTest(test.testCode);
      const resultKey = `${test.orderId}-${test.testCode}`;
      if (!testDef?.parameters) return;

      const isComplete = areAllParametersFilled(resultKey, testDef.parameters.length);

      openModal(ModalType.RESULT_DETAIL, {
        test,
        testDef,
        resultKey,
        results: results[resultKey] || {},
        technicianNotes: technicianNotes[resultKey] || '',
        isComplete,
        onResultsChange: handleResultChange,
        onNotesChange: handleNotesChange,
        onSave: (finalResults?: Record<string, string>, finalNotes?: string) =>
          handleSaveResults(
            test.orderId,
            test.testCode,
            allTests,
            testCatalog,
            orders,
            finalResults,
            finalNotes
          ),
      });
    },
    [
      testCatalog,
      getTest,
      results,
      technicianNotes,
      areAllParametersFilled,
      handleResultChange,
      handleNotesChange,
      handleSaveResults,
      allTests,
      orders,
      openModal,
    ]
  );

  return openTestModal;
}
