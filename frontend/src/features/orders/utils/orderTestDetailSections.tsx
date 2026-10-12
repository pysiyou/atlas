/**
 * DetailGrid sections for the order test detail modal (lab workflow layout).
 */

import { Link } from 'react-router-dom';
import type { DetailGridSectionConfig } from '@/features/lab/workflow/detailModalLayout';
import type { OrderTest, Test } from '@/types';
import { EntityId } from '@/components';
import { INLINE_LINK } from '@/components/theme/recipes';
import { formatCurrency } from '@/utils';
import { formatStatusBadgeLabel } from '@/utils/statusBadge';

export function buildOrderTestDetailGridSections(
  orderTest: OrderTest,
  catalogTest: Test | undefined,
  options?: { onCatalogNavigate?: () => void }
): DetailGridSectionConfig[] {
  const sections: DetailGridSectionConfig[] = [
    {
      title: 'Order test',
      fields: [
        {
          label: 'Test ID',
          value:
            orderTest.id != null ? (
              <EntityId type="orderTest" value={orderTest.id} variant="block" className="text-right" />
            ) : undefined,
        },
        {
          label: 'Test code',
          value: orderTest.testCode ? (
            <EntityId variant="block" className="text-right">{orderTest.testCode}</EntityId>
          ) : undefined,
        },
        {
          label: 'Sample type',
          value: orderTest.sampleType
            ? formatStatusBadgeLabel(orderTest.sampleType)
            : undefined,
        },
        {
          label: 'Status',
          value: formatStatusBadgeLabel(orderTest.status),
        },
        { label: 'Price at order', value: formatCurrency(orderTest.priceAtOrder) },
        { label: 'Created', timestamp: orderTest.createdAt },
        { label: 'Updated', timestamp: orderTest.updatedAt },
      ],
    },
  ];

  const catalogCode = catalogTest?.code ?? orderTest.testCode;
  if (catalogCode) {
    const catalogLabel = catalogTest?.name ?? catalogCode;
    sections.push({
      title: 'Catalog',
      fields: [
        {
          label: 'Catalog entry',
          value: (
            <Link
              to={`/catalog/${catalogCode}`}
              className={`${INLINE_LINK} text-right`}
              onClick={() => options?.onCatalogNavigate?.()}
            >
              {catalogLabel}
            </Link>
          ),
        },
      ],
    });
  }

  const workflowFields: DetailGridSectionConfig['fields'] = [];

  if (orderTest.resultEnteredAt) {
    workflowFields.push({
      label: 'Entered',
      timestamp: orderTest.resultEnteredAt,
      user: orderTest.enteredBy,
    });
  }
  if (orderTest.resultValidatedAt) {
    workflowFields.push({
      label: 'Validated',
      timestamp: orderTest.resultValidatedAt,
      user: orderTest.validatedBy,
    });
  }
  if (orderTest.validationNotes) {
    workflowFields.push({ label: 'Validation notes', value: orderTest.validationNotes });
  }
  if (orderTest.lab?.pipelineStage) {
    workflowFields.push({
      label: 'Lab stage',
      value: formatStatusBadgeLabel(orderTest.lab.pipelineStage),
    });
  }
  if (orderTest.isReflexTest) {
    workflowFields.push({ label: 'Reflex test', value: 'Yes' });
    if (orderTest.triggeredBy) {
      workflowFields.push({ label: 'Triggered by', value: orderTest.triggeredBy });
    }
    if (orderTest.reflexRule) {
      workflowFields.push({ label: 'Reflex rule', value: orderTest.reflexRule });
    }
  }
  if (orderTest.isRetest) {
    workflowFields.push({
      label: 'Retest attempt',
      value: String((orderTest.retestNumber ?? 0) + 1),
    });
  }
  if (orderTest.hasCriticalValues) {
    workflowFields.push({ label: 'Critical values', value: 'Present' });
  }
  if (orderTest.criticalNotifiedAt) {
    workflowFields.push(
      { label: 'Critical notified', timestamp: orderTest.criticalNotifiedAt },
      { label: 'Notified to', value: orderTest.criticalNotifiedTo }
    );
  }
  if (orderTest.criticalAcknowledgedAt) {
    workflowFields.push({
      label: 'Critical acknowledged',
      timestamp: orderTest.criticalAcknowledgedAt,
    });
  }

  if (workflowFields.length > 0) {
    sections.push({ title: 'Workflow', fields: workflowFields });
  }

  return sections;
}

export function formatPipelinePendingMessage(orderTest: OrderTest): string {
  const stage = orderTest.lab?.pipelineStage;
  if (!stage) {
    return 'No results recorded yet.';
  }
  if (stage === 'completed') {
    return 'This test is marked complete; results may still be pending delivery.';
  }
  if (stage === 'cancelled') {
    return 'This test was cancelled.';
  }
  return `Results are not available yet. Current lab stage: ${formatStatusBadgeLabel(stage)}.`;
}
