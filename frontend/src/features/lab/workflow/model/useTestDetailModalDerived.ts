/**
 * Derived presentation state for TestDetailModal.
 */
import { useEffect, useMemo } from 'react';
import type { Order, OrderTest, Test } from '@/types';
import { getLabQueueUrlForTest, hasResultsOnWorkItem, orderTestKey } from '../../utils/labSearchAndLinks';
import {
  buildOrderTestOverviewFields,
  buildOrderTestWorkflowFields,
} from '@/features/orders';
import type { DetailGridSectionConfig } from '../shared/detailModalLayout';
import type { resolveLinkedOrderTests } from './useTestDetailModel';
import type { TestDetailInteraction } from '@/lib/context/modalTypes';
import type { LabModalWorkItem } from '../../types/labQueueChrome';
import {
  useLabDraftStore,
  validationDraftLifecycleKey,
} from '../../state/labDraftStore';

export function useTestDetailModalDerived({
  order,
  orderTest,
  linked,
  catalogTest,
  openLinkedTest,
  onClose,
  detailWorkItem,
  interaction,
  orderTestId,
}: {
  order: Order | undefined;
  orderTest: OrderTest | undefined;
  linked: ReturnType<typeof resolveLinkedOrderTests>;
  catalogTest: Test | undefined;
  openLinkedTest: (linkedTest: OrderTest) => void;
  onClose: () => void;
  detailWorkItem: LabModalWorkItem | undefined;
  interaction: TestDetailInteraction;
  orderTestId: number;
}) {
  const isValidate = interaction === 'validate';
  const hasResults =
    detailWorkItem != null
      ? hasResultsOnWorkItem(detailWorkItem)
      : Boolean(orderTest?.results && Object.keys(orderTest.results).length > 0);
  const draftComments = useLabDraftStore(
    s => s.validationDrafts[orderTestId]?.text ?? ''
  );
  const setValidationComments = useLabDraftStore(s => s.setValidationComments);
  const seedValidationDraft = useLabDraftStore(s => s.seedValidationDraft);

  useEffect(() => {
    if (!isValidate || !orderTest) return;
    seedValidationDraft(orderTestId, {
      text: orderTest.validationNotes ?? '',
      lifecycleKey: validationDraftLifecycleKey(orderTest.status, orderTest.resultEnteredAt),
    });
  }, [isValidate, orderTest, orderTestId, seedValidationDraft]);

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
