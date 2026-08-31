import { useCallback, useRef, useEffect } from 'react';
import { useTestNameLookup } from '@/features/catalog/api/useTestCatalog';
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
  const openTestModalRef =
    useRef<(test: TestWithContext, filteredTests: TestWithContext[]) => void>(undefined);

  const openTestModal = useCallback(
    (test: TestWithContext, filteredTests: TestWithContext[]) => {
      if (!testCatalog) return;

      const testDef = getTest(test.testCode);
      const resultKey = `${test.orderId}-${test.testCode}`;
      if (!testDef?.parameters) return;

      const isComplete = areAllParametersFilled(resultKey, testDef.parameters.length);
      const currentIndex = filteredTests.findIndex(
        t => t.orderId === test.orderId && t.testCode === test.testCode
      );

      const onNext =
        currentIndex < filteredTests.length - 1
          ? () => openTestModalRef.current?.(filteredTests[currentIndex + 1], filteredTests)
          : undefined;
      const onPrev =
        currentIndex > 0
          ? () => openTestModalRef.current?.(filteredTests[currentIndex - 1], filteredTests)
          : undefined;

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
        onNext,
        onPrev,
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

  useEffect(() => {
    openTestModalRef.current = openTestModal;
  }, [openTestModal]);

  return openTestModal;
}
