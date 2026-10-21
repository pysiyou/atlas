/**
 * Derived presentation state for TestDetailModal.
 */
import { useMemo } from 'react';
import type { Order, OrderTest, Test } from '@/types';
import { getLabQueueUrlForTest, hasTestResults, orderTestKey } from '../../utils/labSearchAndLinks';
import {
  buildOrderTestOverviewFields,
  buildOrderTestWorkflowFields,
} from '@/features/orders';
import type { DetailGridSectionConfig } from '../shared/detailModalLayout';
import type { resolveLinkedOrderTests } from './useTestDetailModel';
import type { TestDetailInteraction } from '@/lib/context/modalTypes';
import { useLabDraftStore } from '../../state/labDraftStore';

export function useTestDetailModalDerived({
  order,
  orderTest,
  linked,
  catalogTest,
  openLinkedTest,
  onClose,
  labContext,
  interaction,
  orderTestId,
}: {
  order: Order | undefined;
  orderTest: OrderTest | undefined;
  linked: ReturnType<typeof resolveLinkedOrderTests>;
  catalogTest: Test | undefined;
  openLinkedTest: (linkedTest: OrderTest) => void;
  onClose: () => void;
  labContext: import('@/types').TestWithContext | undefined;
  interaction: TestDetailInteraction;
  orderTestId: number;
}) {
  const isValidate = interaction === 'validate';
  const hasResults = labContext ? hasTestResults(labContext) : false;
  const draftComments = useLabDraftStore(s => s.validationComments[orderTestId] ?? '');
  const setValidationComments = useLabDraftStore(s => s.setValidationComments);

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

  const modalKey = isValidate ? orderTestKey(orderTestId) : `test-detail-${orderTestId}`;
  const comments = isValidate ? draftComments : (orderTest?.validationNotes ?? '');
  const commentKey = orderTestKey(orderTestId);
  const resultsPanelPreset = 'panel.compact.scrollAuto.maxH' as const;

  const onCommentsChange = (value: string) => {
    if (!isValidate) return;
    setValidationComments(orderTestId, value);
  };

  return {
    isValidate,
    hasResults,
    detailGridSections,
    labUrl,
    modalKey,
    comments,
    commentKey,
    resultsPanelPreset,
    onCommentsChange,
  };
}

function buildTestDetailGridSections(
  orderTest: OrderTest,
  linked: ReturnType<typeof resolveLinkedOrderTests>,
  catalogTest: Test | undefined,
  options: {
    onOpenLinkedTest?: (linkedTest: OrderTest) => void;
    omitWorkflowResultDuplicates: boolean;
    onCatalogNavigate: () => void;
  }
): DetailGridSectionConfig[] {
  return [
    {
      preset: 'panel.compact.standard',
      title: 'Workflow',
      fields: buildOrderTestWorkflowFields(orderTest, {
        linked,
        onOpenLinkedTest: options.onOpenLinkedTest,
        omitResultDuplicates: options.omitWorkflowResultDuplicates,
      }),
    },
    {
      preset: 'panel.compact.standard',
      title: 'Test overview',
      fields: buildOrderTestOverviewFields(orderTest, catalogTest, {
        onCatalogNavigate: options.onCatalogNavigate,
      }),
    },
  ];
}
