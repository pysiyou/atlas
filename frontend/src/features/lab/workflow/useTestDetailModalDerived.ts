/**
 * Derived presentation state for TestDetailModal.
 */
import { useMemo } from 'react';
import type { Order, OrderTest, Test } from '@/types';
import { getLabQueueUrlForTest, hasTestResults } from '../utils/labSearchAndLinks';
import { buildTestDetailGridSections } from './detailModal.test.helpers';
import type { resolveLinkedOrderTests } from './useTestDetailModel.resolvers';

export function useTestDetailModalDerived({
  order,
  orderTest,
  linked,
  catalogTest,
  openLinkedTest,
  onClose,
  labContext,
  isValidate,
  validation,
  orderTestId,
}: {
  order: Order | undefined;
  orderTest: OrderTest | undefined;
  linked: ReturnType<typeof resolveLinkedOrderTests>;
  catalogTest: Test | undefined;
  openLinkedTest: (linkedTest: OrderTest) => void;
  onClose: () => void;
  labContext: import('@/types').TestWithContext | undefined;
  isValidate: boolean;
  validation: import('@/lib/context/modalTypes').TestDetailProps['validation'];
  orderTestId: number;
}) {
  const hasResults = labContext ? hasTestResults(labContext) : false;

  const detailGridSections = useMemo(() => {
    if (!orderTest) return undefined;
    return buildTestDetailGridSections(orderTest, linked, catalogTest, {
      onOpenLinkedTest: order ? openLinkedTest : undefined,
      omitWorkflowResultDuplicates: hasResults,
      onCatalogNavigate: onClose,
    });
  }, [orderTest, linked, order, openLinkedTest, hasResults, catalogTest, onClose]);

  const labUrlRaw =
    order && orderTest ? getLabQueueUrlForTest(orderTest, order.orderId) : undefined;
  const labUrl = labUrlRaw ?? undefined;

  const modalKey = isValidate && validation ? validation.commentKey : `test-detail-${orderTestId}`;
  const comments = isValidate && validation ? validation.comments : (orderTest?.validationNotes ?? '');
  const commentKey = validation?.commentKey ?? '';
  const resultsPanelPreset = isValidate
    ? ('lab.modal.resultValidation' as const)
    : ('lab.modal.recordedResults' as const);

  return {
    hasResults,
    detailGridSections,
    labUrl,
    modalKey,
    comments,
    commentKey,
    resultsPanelPreset,
  };
}
